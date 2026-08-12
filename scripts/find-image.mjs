import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const transcript = 'C:/Users/ajeet.k.chouksey/AppData/Roaming/Code/User/workspaceStorage/135f5ebb0b0e3a3e8a3e078f8aad70fa/GitHub.copilot-chat/transcripts/1bd9ff6f-58f6-43ce-b6de-e38e52b74ba9.jsonl';
const lines = readFileSync(transcript, 'utf8').trim().split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  const obj = JSON.parse(lines[i]);
  const raw = lines[i];
  // Check for image data in any form
  if (raw.includes('"image"') || raw.includes('base64') || raw.includes('.png') || raw.includes('.jpg')) {
    const att = obj?.data?.attachments || obj?.data?.images || obj?.attachments;
    if (att) {
      console.log('Line', i, 'type:', obj.type);
      console.log(JSON.stringify(att).substring(0, 500));
      break;
    }
  }
}

// Also scan for any user turn with images
for (let i = lines.length - 1; i >= 0; i--) {
  const obj = JSON.parse(lines[i]);
  if ((obj.type === 'user.turn_start' || obj.type === 'request') && lines[i].length > 500) {
    const snippet = lines[i].substring(0, 600);
    if (snippet.includes('image') || snippet.includes('png') || snippet.includes('jpg')) {
      console.log('\n--- Large user turn at', i, '---');
      console.log(snippet);
      break;
    }
  }
}
