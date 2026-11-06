import { useEffect } from 'react';

// Role Prep is its own app now (ajch_role_prep, roleprep.aaryaai.dev). In-app
// navigation to /roleprep never reaches the edge Worker's 301, so the SPA sends
// people on itself. The retired job-ad pack and question pages land on its home.
const ROLEPREP_URL = 'https://roleprep.aaryaai.dev/';

export default function RolePrepRedirect() {
  useEffect(() => {
    window.location.replace(ROLEPREP_URL);
  }, []);
  return (
    <p className="p-8 text-slate-400">
      Role Prep has its own home now:{' '}
      <a className="text-violet-300 underline" href={ROLEPREP_URL}>roleprep.aaryaai.dev</a>
    </p>
  );
}
