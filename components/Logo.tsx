import { Fingerprint } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-10 h-10" }: LogoProps) {
  return (
    <div className={className}>
      <Fingerprint className="w-full h-full text-white" />
    </div>
  );
}
