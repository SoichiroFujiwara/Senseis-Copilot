import Link from "next/link";

export default function Header() {
    return (
        <div className="bg-purple-100 p-4">
            <Link href="/" className="flex items-end gap-2">
                <div className="text-2xl font-bold">Sensei&apos;s Copilot</div>
                <div className="text-sm text-gray-500">v0.1.0</div>
            </Link>
        </div>
    );
}