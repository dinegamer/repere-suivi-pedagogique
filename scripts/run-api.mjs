import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const portable = path.resolve('.tools/dotnet/dotnet.exe');
const dotnet = process.env.DOTNET_EXE || (existsSync(portable) ? portable : 'dotnet');
const child = spawn(dotnet, ['api/bin/Debug/net10.0/Repere.Api.dll'], {
  stdio: 'inherit', windowsHide: true,
  env: { ...process.env, DOTNET_CLI_HOME: path.resolve('.tools/dotnet-home'), DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_GENERATE_ASPNET_CERTIFICATE: 'false' }
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill());
