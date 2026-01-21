import { isTouchDevice } from "@/common/size";
import { ref } from "vue";

export const showDrawer = ref(true);
export const drawer = ref(!isTouchDevice.value);
