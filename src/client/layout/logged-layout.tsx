import { motion } from "motion/react";
import { Outlet, useLocation } from "react-router";

export const LoggedLayout = () => {
    const { pathname} = useLocation()
    return (
        <div className="flex h-full w-full justify-center py-8">
            <div className="w-full h-full max-w-2xl">
                <motion.div
                    key={pathname}
                    initial={{ y: -0, opacity: 0 }}
                    animate={{ y: 10, opacity: 1 }}
                    exit={{ y: 10, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <Outlet />
                </motion.div>
            </div>
        </div>
    )
}