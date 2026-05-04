import { Shield, Code, Palette, Database, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import sahilImg from '@/assets/team-sahil.jpeg';
import sebinImg from '@/assets/team-sebin.jpeg';
import rushilImg from '@/assets/team-rushil.jpeg';
import darshImg from '@/assets/team-darsh.jpeg';

const team = [
  { name: 'Rushil Raul', role: 'Backend Developer', desc: 'Building robust APIs and database systems for reliable ticket management.', avatar: rushilImg },
  { name: 'Darsh Shetty', role: 'Blockchain Developer', desc: 'Integrating Web3 technologies and smart contracts for NFT ticketing.', avatar: darshImg },
  { name: 'Sahil Topale', role: 'Full Stack Developer', desc: 'Architecting the platform from frontend to backend with scalable solutions.', avatar: sahilImg },
  { name: 'Sebin Sebastian', role: 'Frontend Developer', desc: 'Crafting beautiful, responsive user interfaces with modern React patterns.', avatar: sebinImg },
];

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* Project Description */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 animate-fade-in">
        <Shield className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-primary mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">About Authentix</h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Authentix is a blockchain-ready ticketing system that leverages QR verification technology to prevent fraud
          and enable secure ticket ownership. Our platform combines modern web technologies with blockchain infrastructure
          to create a transparent, tamper-proof event ticketing experience.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 sm:mb-16">
        {[
          { icon: Shield, label: 'Secure QR Verification', desc: 'Every ticket has a unique QR code verified in real-time.' },
          { icon: LinkIcon, label: 'Blockchain Ready', desc: 'Built for NFT ticketing with MetaMask integration.' },
          { icon: Database, label: 'Scalable Backend', desc: 'Enterprise-grade database with role-based access control.' },
          { icon: Code, label: 'Developer Friendly', desc: 'Clean code architecture with modern tooling.' },
        ].map((f, i) => (
          <Card key={i} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-5 sm:p-6 text-center">
              <f.icon className="h-7 w-7 sm:h-8 sm:w-8 mx-auto text-primary mb-3" />
              <h3 className="font-display font-semibold mb-1 text-sm sm:text-base">{f.label}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team */}
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Our Team</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">The developers behind Authentix</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {team.map((member, i) => (
          <Card key={i} className="hover-lift animate-fade-in text-center" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-5 sm:p-6">
              <img
                src={member.avatar}
                alt={member.name}
                loading="lazy"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-4 bg-muted object-cover ring-2 ring-primary/20"
              />
              <h3 className="font-display font-semibold text-base sm:text-lg">{member.name}</h3>
              <p className="text-xs sm:text-sm text-primary font-medium mb-2">{member.role}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{member.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
