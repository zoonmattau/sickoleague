const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.coach.findFirst({
  where: { email: 'matthew.parker@live.com.au' },
  include: { club: true }
}).then(c => {
  console.log('Colors:', c.club.primaryColor, c.club.secondaryColor);
  p.$disconnect();
});
