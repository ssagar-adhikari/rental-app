import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import {
  deleteListingMedia,
  updateListingMedia,
  uploadListingMedia,
  type ListingMediaPayload,
} from "@/services/listingMediaApi";
import { logger } from "@/utils/logger";

type LocalMediaItem = {
  localId: string;
  uri: string;
  fileName: string;
  mimeType: string;
  status: "uploading" | "failed";
  progress: number;
  error?: string;
};

type MediaUploaderProps = {
  listingId: number;
  token: string;
  remoteMedia: ListingMediaPayload[];
  onChange: (next: ListingMediaPayload[]) => void;
  maxItems?: number;
};

const MAX_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.82;

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function inferMimeType(uri: string, fallback?: string | null): string {
  if (fallback) {
    return fallback;
  }

  const ext = uri.split("?")[0]?.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

function inferFileName(uri: string, mimeType: string): string {
  const fromUri = uri.split("/").pop()?.split("?")[0];

  if (fromUri && fromUri.includes(".")) {
    return fromUri;
  }

  const ext = mimeType.split("/")[1] ?? "jpg";
  return `upload-${Date.now()}.${ext}`;
}

async function prepareImage(asset: ImagePicker.ImagePickerAsset) {
  const needsResize =
    (asset.width && asset.width > MAX_DIMENSION) || (asset.height && asset.height > MAX_DIMENSION);

  if (!needsResize) {
    const mimeType = inferMimeType(asset.uri, asset.mimeType ?? null);

    return {
      uri: asset.uri,
      mimeType,
      fileName: asset.fileName ?? inferFileName(asset.uri, mimeType),
    };
  }

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  return {
    uri: manipulated.uri,
    mimeType: "image/jpeg",
    fileName: inferFileName(manipulated.uri, "image/jpeg"),
  };
}

export function MediaUploader({
  listingId,
  token,
  remoteMedia,
  onChange,
  maxItems = 8,
}: MediaUploaderProps) {
  const [pending, setPending] = useState<LocalMediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  const totalItems = remoteMedia.length + pending.length;
  const remaining = Math.max(0, maxItems - totalItems);

  const startUpload = useCallback(
    async (item: LocalMediaItem) => {
      const isFirstUpload = remoteMedia.length === 0;

      try {
        const uploaded = await uploadListingMedia(listingId, {
          uri: item.uri,
          fileName: item.fileName,
          mimeType: item.mimeType,
          isPrimary: isFirstUpload,
          token,
          onProgress: (fraction) => {
            setPending((current) =>
              current.map((entry) =>
                entry.localId === item.localId ? { ...entry, progress: fraction } : entry,
              ),
            );
          },
        });

        setPending((current) => current.filter((entry) => entry.localId !== item.localId));
        onChange([...remoteMedia, uploaded]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        logger.error("media-uploader", error, { listingId });

        setPending((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? { ...entry, status: "failed" as const, error: message }
              : entry,
          ),
        );
      }
    },
    [listingId, onChange, remoteMedia, token],
  );

  const queueAssets = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[]) => {
      if (assets.length === 0) {
        return;
      }

      setBusy(true);

      try {
        for (const asset of assets) {
          const prepared = await prepareImage(asset);
          const item: LocalMediaItem = {
            localId: makeLocalId(),
            uri: prepared.uri,
            fileName: prepared.fileName,
            mimeType: prepared.mimeType,
            status: "uploading",
            progress: 0,
          };

          setPending((current) => [...current, item]);
          startUpload(item);
        }
      } finally {
        setBusy(false);
      }
    },
    [startUpload],
  );

  const pickFromLibrary = useCallback(async () => {
    if (remaining <= 0) {
      Alert.alert("Limit reached", `You can upload up to ${maxItems} images per listing.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photo permission needed", "Allow photo access to add images to your listing.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });

    if (!result.canceled) {
      await queueAssets(result.assets);
    }
  }, [maxItems, queueAssets, remaining]);

  const takePhoto = useCallback(async () => {
    if (remaining <= 0) {
      Alert.alert("Limit reached", `You can upload up to ${maxItems} images per listing.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to take a photo for your listing.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      await queueAssets(result.assets);
    }
  }, [maxItems, queueAssets, remaining]);

  const retry = useCallback(
    (item: LocalMediaItem) => {
      setPending((current) =>
        current.map((entry) =>
          entry.localId === item.localId
            ? { ...entry, status: "uploading" as const, progress: 0, error: undefined }
            : entry,
        ),
      );
      startUpload(item);
    },
    [startUpload],
  );

  const cancelPending = useCallback((item: LocalMediaItem) => {
    setPending((current) => current.filter((entry) => entry.localId !== item.localId));
  }, []);

  const setAsPrimary = useCallback(
    async (media: ListingMediaPayload) => {
      try {
        const updated = await updateListingMedia(listingId, media.id, { is_primary: true }, token);
        onChange(
          remoteMedia.map((entry) =>
            entry.id === media.id ? updated : { ...entry, is_primary: false },
          ),
        );
      } catch (error) {
        logger.error("media-uploader", error, { listingId, mediaId: media.id });
        Alert.alert("Update failed", error instanceof Error ? error.message : "Try again.");
      }
    },
    [listingId, onChange, remoteMedia, token],
  );

  const remove = useCallback(
    async (media: ListingMediaPayload) => {
      try {
        await deleteListingMedia(listingId, media.id, token);
        onChange(remoteMedia.filter((entry) => entry.id !== media.id));
      } catch (error) {
        logger.error("media-uploader", error, { listingId, mediaId: media.id });
        Alert.alert("Delete failed", error instanceof Error ? error.message : "Try again.");
      }
    },
    [listingId, onChange, remoteMedia, token],
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TouchableOpacity
          accessibilityLabel="Add photos from library"
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={busy || remaining <= 0}
          onPress={pickFromLibrary}
          style={[styles.actionButton, (busy || remaining <= 0) && styles.actionButtonDisabled]}
        >
          <Ionicons color="white" name="images-outline" size={18} />
          <Text style={styles.actionButtonText}>Add from library</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Take a new photo"
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={busy || remaining <= 0}
          onPress={takePhoto}
          style={[styles.secondaryButton, (busy || remaining <= 0) && styles.actionButtonDisabled]}
        >
          <Ionicons color={Colors.light.primary} name="camera-outline" size={18} />
          <Text style={styles.secondaryButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helper}>
        {totalItems}/{maxItems} images. Resized to {MAX_DIMENSION}px on the longest edge before upload.
      </Text>

      <View style={styles.grid}>
        {remoteMedia.map((media) => (
          <View key={`remote-${media.id}`} style={styles.tile}>
            <Image source={{ uri: media.url ?? undefined }} style={styles.preview} />
            {media.is_primary ? (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            ) : null}
            <View style={styles.tileActions}>
              {!media.is_primary ? (
                <TouchableOpacity
                  accessibilityLabel="Set as primary"
                  activeOpacity={0.85}
                  onPress={() => setAsPrimary(media)}
                  style={styles.iconButton}
                >
                  <Ionicons color={Colors.light.primary} name="star-outline" size={16} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityLabel="Remove image"
                activeOpacity={0.85}
                onPress={() => remove(media)}
                style={styles.deleteButton}
              >
                <Ionicons color={Colors.light.danger} name="trash-outline" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {pending.map((item) => (
          <View key={`pending-${item.localId}`} style={styles.tile}>
            <Image source={{ uri: item.uri }} style={[styles.preview, styles.pendingPreview]} />
            <View style={styles.statusOverlay}>
              {item.status === "uploading" ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.statusText}>{Math.round(item.progress * 100)}%</Text>
                </>
              ) : (
                <>
                  <Ionicons color="white" name="alert-circle-outline" size={20} />
                  <Text style={styles.statusText} numberOfLines={2}>
                    {item.error ?? "Upload failed"}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.tileActions}>
              {item.status === "failed" ? (
                <TouchableOpacity
                  accessibilityLabel="Retry upload"
                  activeOpacity={0.85}
                  onPress={() => retry(item)}
                  style={styles.iconButton}
                >
                  <Ionicons color={Colors.light.primary} name="refresh-outline" size={16} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityLabel="Remove pending upload"
                activeOpacity={0.85}
                onPress={() => cancelPending(item)}
                style={styles.deleteButton}
              >
                <Ionicons color={Colors.light.danger} name="close-outline" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.primary,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  helper: {
    color: Colors.light.muted,
    ...Typography.eyebrow,
  },
  grid: {
    gap: Spacing.md,
  },
  tile: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  preview: {
    backgroundColor: Colors.light.surfaceMuted,
    height: 170,
    width: "100%",
  },
  pendingPreview: {
    opacity: 0.55,
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
  statusOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.45)",
    bottom: 0,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    left: 0,
    padding: Spacing.md,
    position: "absolute",
    right: 0,
    top: 0,
  },
  statusText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  tileActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
    padding: Spacing.sm,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
