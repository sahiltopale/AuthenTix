import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, LogOut, Shield, Unplug, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';

const navLinks = [
  { to: '/', label: 'Events' },
  { to: '/my-tickets', label: 'My Tickets', auth: true },
  { to: '/contact', label: 'Contact' },
  { to: '/help', label: 'Help' },
  { to: '/about', label: 'About Us' },
];

function WalletButton() {
  const { walletAddress, isConnecting, chainName, connectWallet, disconnectWallet } = useWallet();

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  if (walletAddress) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium transition-all hover:bg-primary/10 hover:border-primary/50 cursor-pointer">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs">{shortAddress}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-medium">Wallet Connected</span>
            </div>
            <div className="rounded-md bg-muted p-2">
              <p className="font-mono text-xs break-all text-foreground">{walletAddress}</p>
            </div>
            {chainName && (
              <p className="text-xs text-muted-foreground">Network: {chainName}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="w-full gap-2 text-destructive hover:text-destructive"
            >
              <Unplug className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={connectWallet}
      disabled={isConnecting}
      className="gap-2 rounded-full"
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Shield className="h-6 w-6" />
            Authentix
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.auth && !user) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                    location.pathname === link.to ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                  location.pathname === '/admin' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('authentix:open-chat'))}
              title="Open Authentix Assistant"
            >
              <MessageCircle className="h-4 w-4" /> Chat
            </Button>
            <WalletButton />
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login / Register</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map(link => {
                if (link.auth && !user) return null;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                      location.pathname === link.to ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted">
                  Admin
                </Link>
              )}
              <div className="flex flex-col gap-2 pt-2 border-t mt-2">
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 justify-start"
                  onClick={() => { window.dispatchEvent(new CustomEvent('authentix:open-chat')); setMobileOpen(false); }}
                >
                  <MessageCircle className="h-4 w-4" /> Chat with Assistant
                </Button>
                <div className="px-3">
                  <WalletButton />
                </div>
                {user ? (
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="gap-2 justify-start">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">Login / Register</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
