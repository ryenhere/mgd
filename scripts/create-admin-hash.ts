import argon2 from 'argon2';

async function readPassword(): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY) throw new Error('Jalankan perintah ini langsung di terminal interaktif.');

  process.stdout.write('Kata sandi admin baru (input disembunyikan): ');
  input.setRawMode(true);
  input.setEncoding('utf8');
  input.resume();

  return new Promise((resolve, reject) => {
    let password = '';
    const finish = (error?: Error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(password);
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          finish(new Error('Pembuatan hash dibatalkan.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          password = password.slice(0, -1);
        } else {
          password += character;
        }
      }
    };
    input.on('data', onData);
  });
}

async function main(): Promise<void> {
  const password = await readPassword();
  if (password.length < 12) {
    throw new Error('Gunakan kata sandi minimal 12 karakter.');
  }
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  process.stdout.write(`ADMIN_PASSWORD_HASH=${hash}\n`);
  process.stdout.write('Simpan hash hanya sebagai environment secret; jangan commit ke Git.\n');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Gagal membuat hash.');
  process.exitCode = 1;
});
