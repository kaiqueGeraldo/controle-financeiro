import { useSwipeable } from "react-swipeable";

type OverlayMobileProps = {
  onClose: () => void;
};

export function OverlayMobile({ onClose }: OverlayMobileProps) {
  const handlers = useSwipeable({
    onSwipedLeft: () => onClose(),
    preventScrollOnSwipe: true,
  });

  return (
    <button
      type="button"
      aria-label="Fechar menu de navegação"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-opacity cursor-pointer"
      {...handlers}
      onClick={onClose}
    />
  );
}
