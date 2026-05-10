import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { MediaUploader } from "@/components/MediaUploader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoriesContext";
import { useListings } from "@/context/ListingsContext";
import { billingUnits } from "@/data/listingOptions";
import { listingToFormValues } from "@/services/listingApi";
import type { ListingMediaPayload } from "@/services/listingMediaApi";
import type { ApiCategoryAttribute, BillingUnit, ListingFormValues, ListingMedia, ListingType, VendorListingCategory } from "@/types/rental";

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "url";
  multiline?: boolean;
};

const typeOptions: { label: string; value: ListingType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Physical", value: "physical", icon: "home-outline" },
  { label: "Service", value: "service", icon: "briefcase-outline" },
  { label: "Hybrid", value: "hybrid", icon: "swap-horizontal-outline" },
];
const maxMediaItems = 8;
const supportedImageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function Field({ icon, label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, multiline && styles.multilineShell]}>
        <Ionicons name={icon} size={19} color={Colors.light.muted} />
        <TextInput
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#98A1B3"
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
        />
      </View>
    </View>
  );
}

function attributeKeyboard(attribute: ApiCategoryAttribute): FieldProps["keyboardType"] {
  return attribute.value_type === "integer" || attribute.value_type === "float" ? "numeric" : "default";
}

function attributePlaceholder(attribute: ApiCategoryAttribute) {
  if (attribute.options?.length) {
    return `Choose ${attribute.attribute.toLowerCase()}`;
  }

  if (attribute.unit) {
    return `Enter ${attribute.attribute.toLowerCase()} in ${attribute.unit}`;
  }

  return `Enter ${attribute.attribute.toLowerCase()}`;
}

function mediaUrlsFromValues(values: ListingFormValues) {
  if (values.media_urls.length) {
    return values.media_urls;
  }

  return values.image_url.trim() ? [values.image_url.trim()] : [];
}

function validateImageUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "Add an image URL first.";
  }

  if (trimmedUrl.length > 2048) {
    return "Image URL is too long.";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return "Image URL must be a valid URL.";
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return "Image URL must start with http:// or https://.";
  }

  const extension = parsedUrl.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();

  if (extension && !supportedImageExtensions.has(extension)) {
    return "Image URL must be JPG, PNG, WEBP, or GIF.";
  }

  return null;
}

function toMediaPayload(media: ListingMedia | undefined, listingId: number): ListingMediaPayload | null {
  if (!media || typeof media.id !== "number") {
    return null;
  }

  return {
    id: media.id,
    listing_id: listingId,
    rentable_unit_id: media.rentable_unit_id ?? null,
    media_type: media.media_type ?? "image",
    url: media.url ?? null,
    path: media.path ?? null,
    alt_text: media.alt_text ?? null,
    mime_type: media.mime_type ?? null,
    size_bytes: typeof media.size_bytes === "number" ? media.size_bytes : null,
    sort_order: media.sort_order ?? 0,
    is_primary: media.is_primary ?? false,
  };
}

export default function VendorListingFormScreen() {
  const { id } = useLocalSearchParams();
  const { loading, token, user } = useAuth();
  const { loading: categoriesLoading, vendorCategories } = useCategories();
  const { createListing, loadListing, updateListing, vendorListings } = useListings();
  const editId = Number(Array.isArray(id) ? id[0] : id);
  const isEditing = Number.isFinite(editId) && editId > 0;
  const cachedListing = useMemo(() => vendorListings.find((listing) => listing.id === editId), [editId, vendorListings]);
  const [values, setValues] = useState<ListingFormValues>(() => listingToFormValues(cachedListing));
  const [loadingListing, setLoadingListing] = useState(isEditing);
  const [saving, setSaving] = useState<"draft" | "pending" | "update" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [remoteMedia, setRemoteMedia] = useState<ListingMediaPayload[]>([]);
  const selectedCategory = useMemo(
    () => vendorCategories.find((category) => category.id === values.category_id),
    [values.category_id, vendorCategories],
  );
  const selectedAttributes = selectedCategory?.attributes ?? [];

  useEffect(() => {
    if (isEditing || !vendorCategories.length) {
      return;
    }

    const currentCategory = vendorCategories.find((category) => category.id === values.category_id);

    if (!currentCategory) {
      setValues((current) => ({
        ...current,
        category_id: vendorCategories[0].id,
        listing_type: vendorCategories[0].listingType,
      }));
    }
  }, [isEditing, values.category_id, vendorCategories]);

  useEffect(() => {
    let mounted = true;

    async function hydrateListing() {
      if (!isEditing) {
        return;
      }

      setLoadingListing(true);

      try {
        const listing = await loadListing(editId);

        if (mounted) {
          setValues(listingToFormValues(listing));
          const items = (listing.media ?? [])
            .map((media) => toMediaPayload(media, listing.id))
            .filter((media): media is ListingMediaPayload => media !== null);
          setRemoteMedia(items);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception instanceof Error ? exception.message : "Unable to load this listing.");
        }
      } finally {
        if (mounted) {
          setLoadingListing(false);
        }
      }
    }

    hydrateListing();

    return () => {
      mounted = false;
    };
  }, [editId, isEditing, loadListing]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.roles.includes("vendor")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  function updateField<Key extends keyof ListingFormValues>(key: Key, value: ListingFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateAttribute(attributeId: number, value: string) {
    setValues((current) => ({
      ...current,
      attribute_values: {
        ...current.attribute_values,
        [attributeId]: value,
      },
    }));
  }

  function selectCategory(category: VendorListingCategory) {
    setValues((current) => ({
      ...current,
      category_id: category.id,
      listing_type: category.listingType,
      attribute_values: {},
    }));
  }

  function setMediaUrls(nextUrls: string[]) {
    const uniqueUrls = Array.from(new Set(nextUrls.map((url) => url.trim()).filter(Boolean))).slice(0, maxMediaItems);

    setValues((current) => ({
      ...current,
      image_url: uniqueUrls[0] ?? "",
      media_urls: uniqueUrls,
    }));
  }

  function addMediaUrl() {
    const trimmedUrl = mediaUrlInput.trim();
    const validationError = validateImageUrl(trimmedUrl);

    if (validationError) {
      setError(validationError);
      return;
    }

    const currentUrls = mediaUrlsFromValues(values);

    if (currentUrls.includes(trimmedUrl)) {
      setError("This image is already added.");
      return;
    }

    if (currentUrls.length >= maxMediaItems) {
      setError(`Add up to ${maxMediaItems} images per listing.`);
      return;
    }

    setMediaUrls([...currentUrls, trimmedUrl]);
    setMediaUrlInput("");
    setError(null);
  }

  function removeMediaUrl(index: number) {
    setMediaUrls(mediaUrlsFromValues(values).filter((_, itemIndex) => itemIndex !== index));
  }

  function moveMediaUrl(index: number, direction: -1 | 1) {
    const nextUrls = [...mediaUrlsFromValues(values)];
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= nextUrls.length) {
      return;
    }

    const currentItem = nextUrls[index];
    nextUrls[index] = nextUrls[nextIndex];
    nextUrls[nextIndex] = currentItem;
    setMediaUrls(nextUrls);
  }

  function validate() {
    if (!vendorCategories.length) {
      return "No child categories are available. Add active child categories from the backend first.";
    }

    if (!values.title.trim()) {
      return "Add a listing title.";
    }

    if (!values.summary.trim()) {
      return "Add a short summary.";
    }

    if (!values.city.trim()) {
      return "Add the listing city.";
    }

    if (!Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
      return "Add a valid price.";
    }

    const invalidMediaUrl = mediaUrlsFromValues(values).find((url) => validateImageUrl(url));

    if (invalidMediaUrl) {
      return validateImageUrl(invalidMediaUrl);
    }

    const missingAttribute = selectedAttributes.find(
      (attribute) => attribute.is_required && !values.attribute_values[attribute.id]?.trim(),
    );

    if (missingAttribute) {
      return `Add ${missingAttribute.attribute}.`;
    }

    return null;
  }

  async function save(status?: "draft" | "pending") {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(isEditing ? "update" : status ?? "draft");
    setError(null);

    try {
      if (isEditing) {
        await updateListing(editId, values, selectedAttributes);
      } else {
        await createListing(values, status ?? "draft", selectedAttributes);
      }

      router.replace("/vendor-listings" as Href);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to save listing.");
      Alert.alert("Listing not saved", exception instanceof Error ? exception.message : "Unable to save listing.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <AppHeader
          eyebrow="Vendor"
          title={isEditing ? "Edit Listing" : "Add Listing"}
          subtitle={isEditing ? "Update listing details, media, price, and location." : "Create a listing and submit it for review."}
          icon={isEditing ? "create-outline" : "add-circle-outline"}
        />

        {loadingListing ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.toolbar}>
              <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" activeOpacity={0.88} style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color={Colors.light.primary} />
              </TouchableOpacity>
              <Text style={styles.toolbarTitle}>{isEditing ? "Listing details" : "New vendor listing"}</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.optionWrap}>
                {categoriesLoading && !vendorCategories.length ? (
                  <ActivityIndicator color={Colors.light.primary} />
                ) : null}
                {vendorCategories.map((category) => {
                  const selected = values.category_id === category.id;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={category.id}
                      style={[styles.categoryChip, selected && styles.selectedChip]}
                      onPress={() => selectCategory(category)}
                    >
                      <Text style={[styles.categoryChipText, selected && styles.selectedChipText]}>{category.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, styles.sectionGap]}>Listing Type</Text>
              <View style={styles.segmentRow}>
                {typeOptions.map((option) => {
                  const selected = values.listing_type === option.value;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={option.value}
                      style={[styles.segmentButton, selected && styles.selectedSegment]}
                      onPress={() => updateField("listing_type", option.value)}
                    >
                      <Ionicons name={option.icon} size={17} color={selected ? "white" : Colors.light.primary} />
                      <Text style={[styles.segmentText, selected && styles.selectedSegmentText]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.fieldStack}>
                <Field icon="text-outline" label="Title" onChangeText={(value) => updateField("title", value)} placeholder="Lazimpat deluxe room" value={values.title} />
                <Field
                  icon="reader-outline"
                  label="Summary"
                  onChangeText={(value) => updateField("summary", value)}
                  placeholder="Short listing summary"
                  value={values.summary}
                />
                <Field
                  icon="document-text-outline"
                  label="Description"
                  multiline
                  onChangeText={(value) => updateField("description", value)}
                  placeholder="Describe the space, service, rules, and highlights"
                  value={values.description}
                />
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Media</Text>

              {isEditing && token ? (
                <View style={styles.fieldStack}>
                  <MediaUploader
                    listingId={editId}
                    onChange={setRemoteMedia}
                    remoteMedia={remoteMedia}
                    token={token}
                  />
                </View>
              ) : (
                <View style={styles.fieldStack}>
                  {!isEditing ? (
                    <Text style={styles.helperText}>
                      Save the listing as a draft to upload photos from your device. You can add image URLs below in the meantime.
                    </Text>
                  ) : null}

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Image URL</Text>
                    <View style={styles.mediaInputRow}>
                      <View style={[styles.inputShell, styles.mediaInputShell]}>
                        <Ionicons name="image-outline" size={19} color={Colors.light.muted} />
                        <TextInput
                          keyboardType="url"
                          onChangeText={setMediaUrlInput}
                          onSubmitEditing={addMediaUrl}
                          placeholder="https://example.com/photo.jpg"
                          placeholderTextColor="#98A1B3"
                          style={styles.input}
                          value={mediaUrlInput}
                        />
                      </View>
                      <TouchableOpacity activeOpacity={0.86} style={styles.addMediaButton} onPress={addMediaUrl}>
                        <Ionicons name="add" size={22} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.mediaGrid}>
                    {mediaUrlsFromValues(values).map((url, index) => (
                      <View key={`${url}-${index}`} style={styles.mediaItem}>
                        <Image source={{ uri: url }} style={styles.mediaPreview} />
                        {index === 0 ? (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>Primary</Text>
                          </View>
                        ) : null}
                        <View style={styles.mediaActions}>
                          <TouchableOpacity
                            activeOpacity={0.86}
                            disabled={index === 0}
                            style={[styles.mediaIconButton, index === 0 && styles.disabledIconButton]}
                            onPress={() => moveMediaUrl(index, -1)}
                          >
                            <Ionicons name="arrow-back" size={16} color={Colors.light.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.86}
                            disabled={index === mediaUrlsFromValues(values).length - 1}
                            style={[styles.mediaIconButton, index === mediaUrlsFromValues(values).length - 1 && styles.disabledIconButton]}
                            onPress={() => moveMediaUrl(index, 1)}
                          >
                            <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity activeOpacity={0.86} style={styles.mediaDeleteButton} onPress={() => removeMediaUrl(index)}>
                            <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {selectedAttributes.length ? (
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Category Attributes</Text>
                <View style={styles.attributeStack}>
                  {selectedAttributes.map((attribute) => {
                    const value = values.attribute_values[attribute.id] ?? "";
                    const label = attribute.unit ? `${attribute.attribute} (${attribute.unit})` : attribute.attribute;

                    if (attribute.value_type === "boolean") {
                      return (
                        <View key={attribute.id} style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>
                            {label}
                            {attribute.is_required ? " *" : ""}
                          </Text>
                          <View style={styles.booleanRow}>
                            {[
                              { label: "Yes", value: "true", icon: "checkmark-outline" as const },
                              { label: "No", value: "false", icon: "close-outline" as const },
                            ].map((option) => {
                              const selected = value === option.value;

                              return (
                                <TouchableOpacity
                                  activeOpacity={0.86}
                                  key={option.value}
                                  style={[styles.booleanButton, selected && styles.selectedSegment]}
                                  onPress={() => updateAttribute(attribute.id, option.value)}
                                >
                                  <Ionicons name={option.icon} size={17} color={selected ? "white" : Colors.light.primary} />
                                  <Text style={[styles.segmentText, selected && styles.selectedSegmentText]}>{option.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    }

                    if (attribute.options?.length) {
                      return (
                        <View key={attribute.id} style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>
                            {label}
                            {attribute.is_required ? " *" : ""}
                          </Text>
                          <View style={styles.optionWrap}>
                            {attribute.options.map((option) => {
                              const selected = value === option;

                              return (
                                <TouchableOpacity
                                  activeOpacity={0.86}
                                  key={option}
                                  style={[styles.categoryChip, selected && styles.selectedChip]}
                                  onPress={() => updateAttribute(attribute.id, option)}
                                >
                                  <Text style={[styles.categoryChipText, selected && styles.selectedChipText]}>{option}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    }

                    return (
                      <Field
                        icon="options-outline"
                        key={attribute.id}
                        keyboardType={attributeKeyboard(attribute)}
                        label={`${label}${attribute.is_required ? " *" : ""}`}
                        onChangeText={(nextValue) => updateAttribute(attribute.id, nextValue)}
                        placeholder={attributePlaceholder(attribute)}
                        value={value}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Price and Availability</Text>

              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Field icon="cash-outline" keyboardType="numeric" label="Price" onChangeText={(value) => updateField("price", value)} placeholder="25000" value={values.price} />
                </View>
                <View style={styles.column}>
                  <Field
                    icon="people-outline"
                    keyboardType="numeric"
                    label="Capacity"
                    onChangeText={(value) => updateField("booking_capacity", value)}
                    placeholder="2"
                    value={values.booking_capacity}
                  />
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Field
                    icon="layers-outline"
                    keyboardType="numeric"
                    label="Quantity"
                    onChangeText={(value) => updateField("available_quantity", value)}
                    placeholder="1"
                    value={values.available_quantity}
                  />
                </View>
                <View style={styles.column}>
                  <Field
                    icon="wallet-outline"
                    label="Currency"
                    onChangeText={(value) => updateField("currency", value)}
                    placeholder="NPR"
                    value={values.currency}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Billing Unit</Text>
              <View style={styles.optionWrap}>
                {billingUnits.map((unit) => {
                  const selected = values.billing_unit === unit.value;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.86}
                      key={unit.value}
                      style={[styles.categoryChip, selected && styles.selectedChip]}
                      onPress={() => updateField("billing_unit", unit.value as BillingUnit)}
                    >
                      <Text style={[styles.categoryChipText, selected && styles.selectedChipText]}>{unit.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Location and Features</Text>
              <View style={styles.fieldStack}>
                <Field icon="business-outline" label="City" onChangeText={(value) => updateField("city", value)} placeholder="Kathmandu" value={values.city} />
                <Field icon="location-outline" label="Address" onChangeText={(value) => updateField("address", value)} placeholder="Lazimpat, Kathmandu" value={values.address} />
                <Field
                  icon="list-outline"
                  label="Features"
                  multiline
                  onChangeText={(value) => updateField("features", value)}
                  placeholder="2 Bed, 1 Bath, Furnished"
                  value={values.features}
                />
              </View>
            </View>

            <View style={styles.footerActions}>
              {isEditing ? (
                <TouchableOpacity activeOpacity={0.88} disabled={Boolean(saving)} style={[styles.primaryButton, saving && styles.disabledButton]} onPress={() => save()}>
                  <Ionicons name="save-outline" size={19} color="white" />
                  <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity activeOpacity={0.88} disabled={Boolean(saving)} style={styles.draftButton} onPress={() => save("draft")}>
                    <Ionicons name="document-outline" size={19} color={Colors.light.primary} />
                    <Text style={styles.draftButtonText}>{saving === "draft" ? "Saving..." : "Save Draft"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.88} disabled={Boolean(saving)} style={[styles.primaryButton, saving && styles.disabledButton]} onPress={() => save("pending")}>
                    <Ionicons name="send-outline" size={19} color="white" />
                    <Text style={styles.primaryButtonText}>{saving === "pending" ? "Submitting..." : "Submit for Review"}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  toolbarTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.label,
  },
  formCard: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  sectionGap: {
    marginTop: Spacing.lg,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  categoryChip: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectedChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryChipText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  selectedChipText: {
    color: "white",
  },
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  segmentButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    minHeight: 44,
  },
  selectedSegment: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  segmentText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  selectedSegmentText: {
    color: "white",
  },
  fieldStack: {
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  helperText: {
    color: Colors.light.muted,
    ...Typography.body,
  },
  mediaInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  mediaInputShell: {
    flex: 1,
  },
  addMediaButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  mediaGrid: {
    gap: Spacing.md,
  },
  mediaItem: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  mediaPreview: {
    backgroundColor: Colors.light.surfaceMuted,
    height: 170,
    width: "100%",
  },
  primaryBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    left: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    position: "absolute",
    top: Spacing.md,
  },
  primaryBadgeText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  mediaActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
    padding: Spacing.sm,
  },
  mediaIconButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  mediaDeleteButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  disabledIconButton: {
    opacity: 0.35,
  },
  attributeStack: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    color: Colors.light.text,
    marginTop: Spacing.md,
    ...Typography.label,
    fontWeight: "900",
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
  },
  multilineShell: {
    alignItems: "flex-start",
    minHeight: 112,
    paddingTop: Spacing.md,
  },
  input: {
    color: Colors.light.text,
    flex: 1,
    ...Typography.body,
    fontWeight: "700",
    minWidth: 0,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  booleanRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  booleanButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    minHeight: 44,
  },
  column: {
    flex: 1,
  },
  footerActions: {
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 54,
  },
  primaryButtonText: {
    color: "white",
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  draftButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.primary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 54,
  },
  draftButtonText: {
    color: Colors.light.primary,
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.65,
  },
});
