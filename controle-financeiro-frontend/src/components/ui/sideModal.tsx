import { motion, AnimatePresence } from "framer-motion";

interface SideModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
}

export function SideModal({ isOpen, title, children }: SideModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-1/2 left-10 -translate-y-1/2 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            perspective: 1200,
          }}
        >
          <motion.div
            className="bg-[#081A40] rounded-r-2xl shadow-2xl p-6 w-full max-w-md h-auto relative"
            initial={{ x: -100, opacity: 0, rotateY: -15 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            exit={{ x: -100, opacity: 0, rotateY: -15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "-10px 10px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            {title && (
              <h2 className="text-2xl font-bold text-text-main mb-4 text-left">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
