import { layerGroupsAtom } from "@/stores/importKMLAtoms";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

export function useMapPreviewData() {
  const layerGroups = useAtomValue(layerGroupsAtom);

  const totalLayers = useMemo(() => {
    return layerGroups.reduce((total, group) => {
      return total + (group.layers?.length || 0);
    }, 0);
  }, [layerGroups]);

  const hasLayers = layerGroups.length > 0;

  return { layerGroups, totalLayers, hasLayers };
}
