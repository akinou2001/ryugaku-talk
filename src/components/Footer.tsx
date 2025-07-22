// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full border-t bg-white/80 backdrop-blur py-6 mt-12">
      <div className="max-w-4xl mx-auto text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Ryugaku Talk. All rights reserved.
      </div>
    </footer>
  );
}
