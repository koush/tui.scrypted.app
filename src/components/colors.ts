import { computed } from "vue";
import { useTheme } from "vuetify";

export function getColors() {
  const theme = useTheme();
  const surfaceColor = computed(() => theme.current.value.colors.surface);

  const transparentSurfaceColor = computed(() => {
    const hex = surfaceColor.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, .6)`;
  });

  return {
    surfaceColor,
    transparentSurfaceColor,
  };
}
