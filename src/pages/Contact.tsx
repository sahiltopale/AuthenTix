import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const RECIPIENT = 'sahil.topale2005@gmail.com';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const subject = encodeURIComponent(`[Authentix Contact] ${form.subject}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    // Open the user's email client with a prefilled message to the developer
    const mailto = `mailto:${RECIPIENT}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    setTimeout(() => {
      setSending(false);
      toast({
        title: 'Opening your email app ✉️',
        description: `Your message is ready to send to ${RECIPIENT}. Please confirm send in your mail client.`,
      });
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 600);
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: RECIPIENT, href: `mailto:${RECIPIENT}` },
    { icon: Phone, label: 'Phone', value: '+91 7760193777', href: 'tel:+917760193777' },
    { icon: MapPin, label: 'Address', value: 'Mumbai, India', href: null },
  ];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
      <div className="text-center mb-8 sm:mb-12 animate-fade-in">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Have a question, feedback or partnership idea? We'd love to hear from you.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        <Card className="lg:col-span-3 animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl sm:text-2xl">Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input placeholder="Your Name" value={form.name} onChange={handleChange('name')} required />
                <Input type="email" placeholder="Your Email" value={form.email} onChange={handleChange('email')} required />
              </div>
              <Input placeholder="Subject" value={form.subject} onChange={handleChange('subject')} required />
              <Textarea placeholder="Your Message" rows={6} value={form.message} onChange={handleChange('message')} required />
              <Button type="submit" className="w-full gap-2" disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Preparing…' : 'Send Message'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will open your email app with the message ready to send to {RECIPIENT}.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          {contactInfo.map((item, i) => {
            const inner = (
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-sm sm:text-base break-all">{item.value}</p>
                </div>
              </CardContent>
            );
            return (
              <Card key={i} className="hover-lift transition-shadow">
                {item.href ? (
                  <a href={item.href} className="block">{inner}</a>
                ) : inner}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
