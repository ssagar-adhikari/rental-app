import { forwardRef, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type {
  BottomSheetBackdropProps,
  BottomSheetProps as GorhomBottomSheetProps,
} from "@gorhom/bottom-sheet";
import { Colors, Radius } from "@/constants/theme";

export type BottomSheetRef = GorhomBottomSheet;

type BottomSheetProps = {
  children: ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  enablePanDownToClose?: boolean;
  onChange?: GorhomBottomSheetProps["onChange"];
  withBackdrop?: boolean;
};

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  {
    children,
    snapPoints,
    index = -1,
    enablePanDownToClose = true,
    onChange,
    withBackdrop = true,
  },
  ref,
) {
  const resolvedSnapPoints = useMemo(() => snapPoints ?? ["50%", "85%"], [snapPoints]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      backdropComponent={withBackdrop ? renderBackdrop : undefined}
      backgroundStyle={styles.background}
      enablePanDownToClose={enablePanDownToClose}
      handleIndicatorStyle={styles.handle}
      index={index}
      onChange={onChange}
      ref={ref}
      snapPoints={resolvedSnapPoints}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </GorhomBottomSheet>
  );
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  handle: {
    backgroundColor: Colors.light.border,
    width: 36,
  },
  content: {
    flex: 1,
  },
});
