# EntregaFácil

## Status do Projeto

Projeto em uso ativo e em evolução contínua.

---

## História do Projeto

O EntregaFácil surgiu de uma necessidade real do meu trabalho como motoboy autônomo.

Eu presto serviço para diferentes comércios locais e utilizava um grupo privado no WhatsApp para registrar manualmente as entregas e os valores cobrados. No final do dia ou do mês, precisava somar tudo manualmente para descobrir meu faturamento, além de não ter um controle organizado de combustível, KM rodado ou lucro real.

Mesmo sem experiência profissional em programação, decidi tentar criar uma solução própria utilizando ferramentas de IA como apoio no desenvolvimento. Meu objetivo principal não era “aprender programação” inicialmente, mas resolver um problema real da minha rotina de trabalho.

A primeira versão do sistema foi construída com apoio de ferramentas de IA e continha funcionalidades básicas como:
- cadastro de entregas;
- tabela de bairros com preços pré-definidos;
- controle de KM e combustível;
- cálculo automático de lucro real.

Depois de começar a utilizar o sistema no dia a dia, percebi que precisava salvar os dados online para conseguir acessar de diferentes dispositivos e evitar perder informações. A partir disso, comecei a estudar formas de hospedar a aplicação e conectar um banco de dados.

Utilizando Netlify e Supabase, consegui transformar o projeto em uma aplicação online com persistência de dados em nuvem.

Conforme fui usando o aplicativo diariamente, novas necessidades surgiram e o sistema passou por várias evoluções:
- criação de uma área de clientes;
- organização das entregas por empresa;
- controle de ganhos de aplicativos de corrida;
- dashboard financeiro mais completo;
- melhorias de interface e usabilidade.

Durante esse processo também enfrentei diversos problemas técnicos, principalmente por ainda estar aprendendo desenvolvimento de software na prática. Em alguns momentos partes do código e do banco de dados quebraram após grandes alterações, exigindo:
- reconstrução de tabelas;
- reorganização da lógica da aplicação;
- adaptação do banco de dados para novas funcionalidades;
- correções de sincronização;
- refatorações estruturais.

Na versão mais recente, o projeto evoluiu para um sistema multiusuário com:
- login por e-mail e senha;
- personalização individual por usuário;
- configuração customizada de bairros e preços;
- adaptação para diferentes cidades e formas de cobrança.

Hoje continuo utilizando o sistema diariamente como ferramenta operacional real enquanto estudo programação e desenvolvimento de software de forma prática. Grande parte do projeto foi desenvolvida com apoio de ferramentas de IA, sempre com foco em resolver problemas reais e aprender durante o processo.

---

## Funcionalidades

### Gestão de Entregas
- Registro de entregas
- Controle de bairros e preços
- Histórico de entregas
- Organização por cliente

### Controle Financeiro
- Controle de combustível
- Registro de KM rodado
- Cálculo de lucro real
- Dashboard financeiro

### Sistema Multiusuário
- Login com e-mail e senha
- Configurações personalizadas
- Tabela de bairros customizável

### Integração Online
- Persistência de dados em nuvem
- Sincronização com Supabase
- Acesso de diferentes dispositivos

---

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript Vanilla

### Backend / Infraestrutura
- Supabase
- PostgreSQL
- Netlify

### Bibliotecas
- Chart.js

---

## Desenvolvimento Assistido por IA

Grande parte do desenvolvimento do projeto foi realizada com apoio de ferramentas de IA, principalmente Claude Code, ChatGPT e Gemini.

As ferramentas foram utilizadas para:
- acelerar implementação de funcionalidades;
- auxiliar na estruturação do código;
- solucionar erros;
- explicar conceitos técnicos;
- apoiar refatorações e alterações no banco de dados.

O projeto também foi utilizado como ambiente prático de aprendizado em desenvolvimento web e lógica de programação.

---

## Objetivo do Projeto

O principal objetivo do EntregaFácil é simplificar o controle operacional e financeiro de profissionais que trabalham com entregas e aplicativos, centralizando informações operacionais e financeiras em um único sistema web simples, leve e acessível.

---

## Melhorias Futuras

- Transformar o sistema em PWA
- Exportação de relatórios em Excel, PDF e Word
- Controle de manutenção da moto
- Backup automático
- Integração com mapas
- Melhorias no dashboard
- Aplicativo mobile nativo
- Notificações e lembretes
