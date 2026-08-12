import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-dusk px-6 text-center text-cream">
      <div>
        <p className="grove-kicker">Missing grove</p>
        <h1 className="font-display text-4xl">This tree was not found.</h1>
        <Link href="/" className="grove-btn-primary mt-6 inline-flex">
          Back home
        </Link>
      </div>
    </div>
  );
}
