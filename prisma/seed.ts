import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const password = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@example.com',
      password,
      name: 'Demo User',
    },
  })

  console.log(`✅ User created: ${user.username} (password: password123)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
