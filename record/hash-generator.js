const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'ktkrr0714'; // ここにパスワードを入力
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`パスワード: ${password}`);
  console.log(`ハッシュ値: ${hash}`);
}

generateHash();