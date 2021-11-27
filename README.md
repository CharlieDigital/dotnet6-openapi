# .NET 6 OpenAPI with TypeScript Client Generation

This is a sample application demonstrating .NET 6 with OpenAPI client code generation.

While gRPC and GraphQL seem to be *en vogue*, REST with OpenAPI offers many of the same benefits in terms of contract and client generation.  REST can't match subscriptions and streaming capabilities built into gRPC and GraphQL (not to mention the other features on those platforms), but it's hard to beat the universal support for simple HTTP request/responses, ease of development, linear and predictable scaling of complexity, and maturity of REST.

OpenAPI makes it more productive than ever to work with REST APIs and paired with managed WebSockets via [Azure SignalR](https://azure.microsoft.com/en-us/services/signalr-service/) or [Azure Web PubSub](https://azure.microsoft.com/en-us/services/web-pubsub/), building low-complexity, high performance web APIs is easier than ever.

See for more discussion and my thoughts on gRPC, GraphQL, and REST: https://charliedigital.com/2021/11/25/net-6-web-apis-openapi-typescript-client-generation/

## Organization

This project is set up as a mono-repo for simplicity.

- `root`
  - `api` contains the .NET 6 web API
  - `web` contains the static web front-end in **Svelte**
    - `references` contains the generated client reference
  - `web-vue` contains the static web front-end in **Vue**

## DIY

### .NET Web API

Start by creating the directory for the API:

```
mkdir api
cd api
```

Then we set up the .NET 6 Web API project:

```
dotnet new webapi
```

This will create a default project using the .NET web APIs.

You can start this project by running

```
dotnet run
```

You'll see output like the following:

```
C:\Users\chenc\Code\OSS\dotnet6-openapi\api>dotnet run
Building...
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7277
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5133
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Development
info: Microsoft.Hosting.Lifetime[0]
      Content root path: C:\Users\chenc\Code\OSS\dotnet6-openapi\api\
```

Opening your browser to `https://localhost:7277` will display an empty page.

However, you can view your OpenAPI schema here:

```
https://localhost:7277/swagger/v1/swagger.json
```

And view the UI here:

```
https://localhost:7277/swagger/index.html
```

### Generating Swagger at Build

This default mechanism works great if you plan on generating your OpenAPI schemas at runtime.  But if you want to generate your OpenAPI at build time, we'll need to add some tooling.

We'll be adding a [Svelte](https://svelte.dev/) UI with [vite](https://vitejs.dev/) later.  But we'll need to set up our folder now (since we can't initialize the template into an non-empty directory) and then switch back to `api`

```
cd ../
yarn create vite web --template svelte-ts
cd web
yarn
mkdir references
cd references
mkdir codegen
cd ../../api
```

We've created a basic Svelte TypeScript application that will be built with vite.

These next steps are adapted from: https://khalidabuhakmeh.com/generate-aspnet-core-openapi-spec-at-build-time

First, we'll need to install tooling to generate the schema at build time.

```
dotnet new tool-manifest
dotnet tool install SwashBuckle.AspNetCore.Cli
```

The `.csproj` file needs to be modified to invoke the CLI

Update the `csproj` file:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
    <PropertyGroup>
        <TargetFramework>net6.0</TargetFramework>
    </PropertyGroup>

    <ItemGroup>
        <PackageReference Include="Swashbuckle.AspNetCore" Version="6.1.4" />
    </ItemGroup>

    <Target Name="OpenAPI" AfterTargets="Build" Condition="$(Configuration)=='Debug'">
        <Exec Command="dotnet swagger tofile --output ../web/references/swagger.yaml --yaml $(OutputPath)$(AssemblyName).dll v1" WorkingDirectory="$(ProjectDir)" />
        <Exec Command="dotnet swagger tofile --output ../web/references/swagger.json $(OutputPath)$(AssemblyName).dll v1" WorkingDirectory="$(ProjectDir)" />
    </Target>
</Project>
```

Now when you run

```
dotnet build
```

This will generate the two files in our `web/references` directory.

### Generating TypeScript Client

This gets us 2/3 of the way there.  Now we want to generate a TypeScript client automatically from our schema so that we don't have to perform raw AJAX calls.

Since our client will be used for a static web front-end, we can use `npm` or `yarn` to generate our client using the `openapi-typescript-codegen` project.

- https://www.npmjs.com/package/openapi-typescript-codegen
- https://yarnpkg.com/package/openapi-typescript

We'll use `yarn` for this walkthrough.

```
cd ../web
yarn add --dev openapi-typescript-codegen
yarn openapi --input references/swagger.json --output references/codegen --client axios --postfix Service --useOptions --useUnionTypes
```

This will use the schemas to generate the *client TypeScript* for interacting with our services 🎉

### Automating with Yarn

To simplify this, we can create a script that builds the full chain from the web project.

Still in the `web` directory, modify the `package.json` file to add a script:

```json
{
  // ...
  "scripts": {
    "codegen": "cd ../api && dotnet build && cd ../web && yarn openapi --input references/swagger.json --output references/codegen --client axios --postfix Service --useOptions --useUnionTypes"
    // ...
  }
  // ...
}
```

Now if we run `yarn run codegen` from the `web` project, this will:

1. Build our .NET 6 WebAPI project
2. Generate an updated `swagger.json` and `swagger.yaml` file in the `web/references` directory
3. Generate an updated TypeScript client in the `web/references/client` directory

Sweet!

### Building the Front-end

Before we start updating the Svelte app, we'll need to update our API to allow CORS since the apps are at two different URLs.

In `program.cs`, we add:

```csharp
// We need this to call our API from the static front-end
app.UseCors(options => {
    options.AllowAnyHeader();
    options.AllowAnyMethod();
    options.AllowAnyOrigin();
});
```

anywhere before `app.Run()`.  In a separate terminal in the `api` directory, start our API with `dotnet run`.  Pay attention to the port.

Now let's get back to our front-end.

To see it, we switch into the `web` directory and run `yarn dev`

```
yarn dev
```

This will start our application and load it in the default browser.

the `App.svelte` file is what we're going to modify.

In the top `<script>` tag:

```javascript
// Import our client
import { OpenAPI, WeatherForecast, WeatherForecastService } from '../references/codegen/index'
OpenAPI.BASE = "https://localhost:7277"; // Set this to match your local API endpoint.

// Async function
async function loadForecast(): Promise<WeatherForecast[]> {
  return await WeatherForecastService.getWeatherForecast();
}

// Promise handle
let forecast = loadForecast();
```

Then in our `<main>`:

```svelte
{#await forecast}
  <p>Loading forecast...</p>
{:then days}
  {#each days as day}
    <p>{ day.summary }</p>
  {/each}
{/await}
```

Now our UI should display 5 days of forecasts 😎

Side note: I'm not a huge fan of the Svelte template syntax.

## Using .NET Hot Reload

Instead of using

```
dotnet run
```

We can use:

```
dotnet watch
```

instead.

Now in `api/Controllers/WeatherForecastController.cs`, we can change the number of days from 5 to 7:

```csharp
[HttpGet(Name = "GetWeatherForecast")]
public IEnumerable<WeatherForecast> Get()
{
    return Enumerable.Range(1, 5).Select(index => new WeatherForecast
    {
        Date = DateTime.Now.AddDays(index),
        TemperatureC = Random.Shared.Next(-20, 55),
        Summary = Summaries[Random.Shared.Next(Summaries.Length)]
    })
    .ToArray();
}
```

and then refresh our front-end to see 7 days instead of 5.
