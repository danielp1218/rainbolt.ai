interface LayoutProps {
    children: React.ReactNode;
};

const Layout = ({children,}: LayoutProps) =>
{
    return (
        <div className = "flex flex-col gap-y-4">
            <nav className = "text-xs p-1 bg-red-500 text-white">
                I an a reusable navbar
            </nav>
            {children}
        </div>
    );
}

export default Layout