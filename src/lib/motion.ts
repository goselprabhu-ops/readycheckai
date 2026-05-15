/**
 * Centralized motion re-export.
 *
 * Importing from a single module ensures the bundler can tree-shake
 * framer-motion features consistently across the app and gives us a
 * single seam to swap engines later (e.g. motion/react-mini) without
 * touching every page.
 */
export { motion, AnimatePresence } from "framer-motion";
export type { Variants, Transition, MotionProps } from "framer-motion";