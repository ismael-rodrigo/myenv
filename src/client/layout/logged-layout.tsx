import { Outlet } from "react-router";

export const LoggedLayout = () => {
    return (
        <div className="flex h-full w-full justify-center py-8">
            <div className="w-full h-full max-w-3xl">
                <Outlet />
            </div>
        </div>
    )
}
