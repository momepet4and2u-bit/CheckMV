import { AnimatePresence, motion } from "motion/react"

export default function PresenceAnimation({ children, className, as = 'div', isVisible, itemKey }: PresenceAnimationProps) {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MotionTag = (motion as any)[as] as any;

    return (
        <AnimatePresence initial={false}>
            {isVisible && (
                <MotionTag
                    key={itemKey}
                    className={className}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                >
                    {children}
                </MotionTag>
            )}
        </AnimatePresence>
    )
}

interface PresenceAnimationProps {
    children: React.ReactNode;
    className: string;
    as?: keyof typeof motion;
    isVisible: boolean;
    itemKey: React.Key;
}