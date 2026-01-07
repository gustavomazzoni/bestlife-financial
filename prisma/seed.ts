import prisma from '@/lib/db';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
} from '@/generated/prisma/client';

const categories = [
  // Income Categories
  {
    name: 'Salary',
    type: TransactionType.INCOME,
    icon: '💼',
    color: '#10B981',
  },
  {
    name: 'Passive Income',
    type: TransactionType.INCOME,
    icon: '💰',
    color: '#34D399',
  },
  {
    name: 'Business',
    type: TransactionType.INCOME,
    icon: '🏢',
    color: '#059669',
  },
  {
    name: 'Investments',
    type: TransactionType.INCOME,
    icon: '📈',
    color: '#047857',
  },
  {
    name: 'Freelance',
    type: TransactionType.INCOME,
    icon: '💻',
    color: '#6EE7B7',
  },
  {
    name: 'Other Income',
    type: TransactionType.INCOME,
    icon: '💵',
    color: '#A7F3D0',
  },

  // Expense Categories
  {
    name: 'Housing',
    type: TransactionType.EXPENSE,
    icon: '🏠',
    color: '#EF4444',
  },
  { name: 'Food', type: TransactionType.EXPENSE, icon: '🍔', color: '#F97316' },
  {
    name: 'Transport',
    type: TransactionType.EXPENSE,
    icon: '🚗',
    color: '#F59E0B',
  },
  {
    name: 'Health',
    type: TransactionType.EXPENSE,
    icon: '⚕️',
    color: '#EC4899',
  },
  {
    name: 'Entertainment',
    type: TransactionType.EXPENSE,
    icon: '🎬',
    color: '#8B5CF6',
  },
  {
    name: 'Education',
    type: TransactionType.EXPENSE,
    icon: '📚',
    color: '#6366F1',
  },
  {
    name: 'Personal',
    type: TransactionType.EXPENSE,
    icon: '👤',
    color: '#06B6D4',
  },
  {
    name: 'Bills',
    type: TransactionType.EXPENSE,
    icon: '📄',
    color: '#DC2626',
  },
  {
    name: 'Shopping',
    type: TransactionType.EXPENSE,
    icon: '🛍️',
    color: '#DB2777',
  },
  {
    name: 'Travel',
    type: TransactionType.EXPENSE,
    icon: '✈️',
    color: '#0EA5E9',
  },
  {
    name: 'Other Expense',
    type: TransactionType.EXPENSE,
    icon: '💸',
    color: '#64748B',
  },

  // Saving Categories
  {
    name: 'Emergency Fund',
    type: TransactionType.SAVING,
    icon: '🛡️',
    color: '#3B82F6',
  },
  {
    name: 'Investments',
    type: TransactionType.SAVING,
    icon: '📊',
    color: '#2563EB',
  },
  {
    name: 'Retirement',
    type: TransactionType.SAVING,
    icon: '🏖️',
    color: '#1D4ED8',
  },
  {
    name: 'Other Saving',
    type: TransactionType.SAVING,
    icon: '💎',
    color: '#60A5FA',
  },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  console.log('📊 Criando categorias padrão...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {
        icon: category.icon,
        color: category.color,
      },
      create: category,
    });
  }

  // 2. Criar Usuário de Teste
  console.log('👤 Criando usuário de teste...');
  const user = await prisma.user.upsert({
    where: { email: 'demo@lifeos.com' },
    update: {},
    create: {
      email: 'demo@lifeos.com',
      name: 'Usuário Demo',
      image: 'https://github.com/shadcn.png',
      // Dados financeiros iniciais
      currentInvestments: 50000,
      emergencyFund: 15000,
      dreamLifestyleCost: 12000,
    },
  });

  // 3. Criar algumas transações de exemplo
  console.log('💸 Criando transações de exemplo...');
  const transactionsCheck = await prisma.transaction.count({
    where: { userId: user.id },
  });

  if (transactionsCheck === 0) {
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          date: new Date(),
          amount: 8500,
          description: 'Salário Mensal',
          type: TransactionType.INCOME,
          category: 'Salário',
          necessityLevel: NecessityLevel.IMPORTANT,
          valueAlignment: ValueAlignment.FREEDOM_ENABLING,
        },
        {
          userId: user.id,
          date: new Date(),
          amount: 2500,
          description: 'Aluguel',
          type: TransactionType.EXPENSE,
          category: 'Moradia',
          necessityLevel: NecessityLevel.IMPORTANT,
          valueAlignment: ValueAlignment.ALIGNED,
        },
        {
          userId: user.id,
          date: new Date(),
          amount: 600,
          description: 'Supermercado Semanal',
          type: TransactionType.EXPENSE,
          category: 'Alimentação',
          necessityLevel: NecessityLevel.NEEDS,
          valueAlignment: ValueAlignment.DEFAULT,
        },
      ],
    });
  }

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
