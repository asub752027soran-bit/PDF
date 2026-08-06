import React, { useState } from 'react';
import { X, Server, Copy, Check, Terminal, ShieldCheck, Globe, Cpu } from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Update Server & Install Dependencies (Node 20, PM2, Nginx)',
      code: `apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git certbot python3-certbot-nginx
npm install -g pm2`,
    },
    {
      title: '2. Prepare Project Directory & Run Automated Deploy Script',
      code: `mkdir -p /var/www/pdfeditfy
cd /var/www/pdfeditfy

# Download/Clone your repo into /var/www/pdfeditfy
# git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Execute 1-click deploy script (creates swap memory, builds & starts PM2)
chmod +x deploy.sh && bash deploy.sh`,
    },
    {
      title: '3. Manual Build & Launch (Alternative to deploy.sh)',
      code: `cd /var/www/pdfeditfy
npm install
NODE_OPTIONS="--max-old-space-size=4096" npm run build
pm2 delete pdfeditfy 2>/dev/null || true
pm2 start dist/server.cjs --name "pdfeditfy" --cwd /var/www/pdfeditfy -f
pm2 save
pm2 startup`,
    },
    {
      title: '4. Configure Nginx Reverse Proxy for pdfeditfy.com',
      code: `# Remove default Nginx site to prevent port conflicts
rm -f /etc/nginx/sites-enabled/default

# Create site configuration
cat << 'EOF' > /etc/nginx/sites-available/pdfeditfy
server {
    listen 80;
    server_name pdfeditfy.com www.pdfeditfy.com 200.141.13.181;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/pdfeditfy /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx`,
    },
    {
      title: '5. SSL Certificate via Let\'s Encrypt for pdfeditfy.com',
      code: `certbot --nginx -d pdfeditfy.com -d www.pdfeditfy.com`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hostinger VPS Deployment Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Production deployment setup with Node.js, PM2, Nginx & SSL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2 text-xs">
          
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                Fixing Terminal Errors for pdfeditfy.com:
              </h4>
              <ul className="list-disc list-inside text-amber-800/90 dark:text-amber-300/90 space-y-1 text-[11px] leading-relaxed">
                <li><strong>Out of Memory / Killed / Heap Error during build:</strong> Run <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">bash deploy.sh</code> — it automatically creates a 2GB swap file and sets <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">NODE_OPTIONS=--max-old-space-size=4096</code>!</li>
                <li><strong>PM2 Script already launched:</strong> Run <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">pm2 restart pdfeditfy</code> to restart, or <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">pm2 delete pdfeditfy</code> before starting again!</li>
                <li><strong>Git Auth Error:</strong> GitHub requires a Personal Access Token instead of a password, or a public repository.</li>
                <li><strong>No package.json / Script not found:</strong> Make sure you run <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">cd /var/www/pdfeditfy</code> before running build or deploy commands!</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                Hostinger VPS Details (srv1883498.hstgr.cloud)
              </h4>
              <p className="text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                <strong>IP:</strong> 200.141.13.181 &bull; <strong>OS:</strong> Ubuntu 24.04 LTS &bull; <strong>User:</strong> root<br />
                Follow the 6 steps below or run the commands in your Hostinger Web Terminal or SSH client.
              </p>
            </div>
          </div>

          {steps.map((step, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{step.title}</span>
                <button
                  onClick={() => copyCode(step.code, idx)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Script
                    </>
                  )}
                </button>
              </h4>
              <pre className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                {step.code}
              </pre>
            </div>
          ))}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Need Docker deployment? Container builds using standard Node 20 base image.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
