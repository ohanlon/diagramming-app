import { useEffect, RefObject } from 'react';
import { useDiagramStore } from '../../store/useDiagramStore';

export const useAutosize = (
  shapeId: string,
  text: string,
  fontSize: number | undefined,
  autosize: boolean | undefined,
  textRef: RefObject<HTMLDivElement>,
  checkOverflow: () => void
) => {
  const { updateShapeHeight } = useDiagramStore();

  useEffect(() => {
    if (autosize && textRef.current) {
      const PADDING = 6; // 3px padding on each side
      const newHeight = textRef.current.scrollHeight + PADDING;
      updateShapeHeight(shapeId, newHeight);
    }
    checkOverflow();
  }, [text, fontSize, autosize, shapeId, updateShapeHeight, checkOverflow, textRef]);
};
