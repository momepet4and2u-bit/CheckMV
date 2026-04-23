import * as motion from "motion/react-client";

export default function EnterAnimation({ children, className, as } : EnterAnimationProps) {

    const MotionTag = motion[as];
    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0, 0.71, 0.2, 1.01],
            }}// no afecta estilos internos
        >
            {children}
        </MotionTag>
    );
}

interface EnterAnimationProps{
    children: React.ReactNode;
    className: string;
    as: keyof typeof motion;
}
