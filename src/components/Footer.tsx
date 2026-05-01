import { Shield, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold text-primary mb-2">
              <Shield className="h-5 w-5" /> Authentix
            </div>
            <p className="text-sm text-muted-foreground">
              Blockchain-ready event ticketing with QR verification.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-2">Quick Links</h4>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Events</Link>
              <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              <Link to="/help" className="hover:text-primary transition-colors">Help</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-2">Connect</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Developed by <span className="font-medium text-foreground">Sahil Topale &amp; Co.</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('authentix:open-chat'))}
            >
              <MessageCircle className="h-4 w-4" /> Chat with Assistant
            </Button>
          </div>
        </div>
        <div className="border-t mt-6 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Authentix · Developed by Sahil Topale &amp; Co. · All rights reserved.
        </div>
      </div>
    </footer>
  );
}
