import { Shield, Code, Palette, Database, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const team = [
  { name: 'Sahil Topale', role: 'Full Stack Developer', desc: 'Architecting the platform from frontend to backend with scalable solutions.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sahil' },
  { name: 'Sebin Sebastian', role: 'Frontend Developer', desc: 'Crafting beautiful, responsive user interfaces with modern React patterns.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebin' },
  { name: 'Rushil Raul', role: 'Backend Developer', desc: 'Building robust APIs and database systems for reliable ticket management.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rushil' },
  { name: 'Darsh Shetty', role: 'Blockchain Developer', desc: 'Integrating Web3 technologies and smart contracts for NFT ticketing.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Darsh' },
];

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Project Description */}
      <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
        <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="font-display text-4xl font-bold mb-4">About Authentix</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Authentix is a blockchain-ready ticketing system that leverages QR verification technology to prevent fraud
          and enable secure ticket ownership. Our platform combines modern web technologies with blockchain infrastructure
          to create a transparent, tamper-proof event ticketing experience.
        </p>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {[
          { icon: Shield, label: 'Secure QR Verification', desc: 'Every ticket has a unique QR code verified in real-time.' },
          { icon: LinkIcon, label: 'Blockchain Ready', desc: 'Built for NFT ticketing with MetaMask integration.' },
          { icon: Database, label: 'Scalable Backend', desc: 'Enterprise-grade database with role-based access control.' },
          { icon: Code, label: 'Developer Friendly', desc: 'Clean code architecture with modern tooling.' },
        ].map((f, i) => (
          <Card key={i} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-6 text-center">
              <f.icon className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-display font-semibold mb-1">{f.label}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team */}
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="font-display text-3xl font-bold">Our Team</h2>
        <p className="text-muted-foreground mt-2">The developers behind Authentix</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {team.map((member, i) => (
          <Card key={i} className="hover-lift animate-fade-in text-center" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-6">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 bg-muted"
              />
              <h3 className="font-display font-semibold">{member.name}</h3>
              <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
              <p className="text-xs text-muted-foreground">{member.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
