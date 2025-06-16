import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className=" py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © 2025 Uchindami All rights reserved.
          </div>

          {/* Made with love in Malawi */}
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-red-400" fill="currentColor" />
            <span>in</span>
            <div className="flex items-center space-x-1">
              <span>Malawi</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
