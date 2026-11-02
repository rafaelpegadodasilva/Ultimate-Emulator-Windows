# Ultimate Emulator para Windows

Aplicativo Windows x64 para organizar e executar jogos clássicos em uma biblioteca única. O projeto é dedicado somente ao emulador Windows. Capas, ROMs, saves e dados pessoais ficam fora do repositório; o pacote completo com capas é baixado exclusivamente pelo link do Google Drive.

## Download

[Baixar o Ultimate Emulator para Windows](https://drive.google.com/uc?export=download&id=18W3Oqag_MtgMBTJYcndkrVD22SMvL9hH)

O download é hospedado no Google Drive. O link acima é clicável e aponta diretamente para o arquivo compartilhado.

## Informações

- Versão do projeto: `1.5.18`
- Compatibilidade: Windows 10/11, x64
- 25 plataformas configuradas
- Biblioteca atual exibida no ambiente de desenvolvimento: 487 jogos
- Interface em português do Brasil
- Busca global e busca manual de ROMs
- Biblioteca em grade, lista e galeria
- Suporte a teclado, controles, vibração compatível, turbo, cheats, saves e save states
- Integração com RetroArch, MAME, Dolphin, DuckStation, PCSX2, PPSSPP e Vita3K

## Desenvolvimento

```powershell
npm ci
npm start
```

Para gerar a pasta Windows:

```powershell
npm run build:dir
```

O repositório contém somente o código-fonte. A pasta `Capas`, a pasta `ROMS`, o banco de dados pessoal da biblioteca, saves e os binários distribuídos ficam fora dele; o pacote completo com capas é obtido exclusivamente pelo link do Google Drive acima.

## Execução portátil

O pacote distribuído pode ser aberto pelo arquivo `Abrir Ultimate Emulator.cmd`. A biblioteca de jogos deve ser escolhida pelo próprio aplicativo ou colocada na pasta de ROMs definida no ambiente do usuário.
