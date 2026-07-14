import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
// A importação abaixo vai falhar propositalmente agora (TDD), pois ainda não criamos o arquivo
// import { AuthService } from './auth.service';

describe('AuthService', () => {
  // Limpa a tabela de usuários antes de cada teste para garantir isolamento
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe.skip('registerOrLoginUser', () => {
    it('should create a new user if email does not exist', async () => {
      const email = 'newuser@lifeos.com';

      // Ação: Tentar logar com um usuário novo
      // const user = await AuthService.registerOrLoginUser(email);

      // Verificação: O usuário deve ser retornado e existir no banco
      // expect(user).toHaveProperty('id');
      // expect(user.email).toBe(email);
      // expect(user.currentInvestments.toNumber()).toBe(0); // Valor default do schema

      // Verificação dupla: Consultar direto no banco
      const dbUser = await prisma.user.findUnique({ where: { email } });
      expect(dbUser).toBeDefined();
    });

    it('should return existing user if email already exists', async () => {
      const email = 'existing@lifeos.com';

      // Setup: Criar um usuário manualmente no banco
      await prisma.user.create({
        data: {
          email,
          name: 'Existing User',
          currentInvestments: 1000,
        },
      });

      // Ação: Tentar logar com o mesmo email
      // const user = await AuthService.registerOrLoginUser(email);

      // Verificação: Deve retornar o MESMO usuário (não criar outro)
      // expect(user.email).toBe(email);
      // expect(user.name).toBe('Existing User');

      // Garantir que não duplicou registros
      const count = await prisma.user.count({ where: { email } });
      expect(count).toBe(1);
    });
  });
});
