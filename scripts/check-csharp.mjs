import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const portable = path.resolve('.tools/dotnet/dotnet.exe');
const dotnet = process.env.DOTNET_EXE || (existsSync(portable) ? portable : 'dotnet');
const env = { ...process.env, DOTNET_CLI_HOME: path.resolve('.tools/dotnet-home'), DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_GENERATE_ASPNET_CERTIFICATE: 'false', NUGET_PACKAGES: path.resolve('.tools/nuget') };
for (const args of [['build', 'api.tests/Repere.DomainTests.csproj'], ['run', '--project', 'api.tests/Repere.DomainTests.csproj', '--no-build']]) {
  const result = spawnSync(dotnet, args, { stdio: 'inherit', env, windowsHide: true });
  if (result.error) { console.error('SDK .NET 10 requis : ' + result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
