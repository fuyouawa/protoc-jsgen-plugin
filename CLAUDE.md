# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a C# Protobuf compiler plugin (`protoc-gen-js-mjs`) that generates JavaScript/ECMAScript modules (.mjs files) from .proto files. It implements Google's protoc plugin protocol (reading from stdin, writing to stdout).

**Key design decision:** Uses getter/setter functions (方案B from `Protobuf生成JS方案.md`) to solve the naming conflict between JavaScript camelCase and Protobuf snake_case conventions.

## Build and Test Commands

### C# Plugin Build
```bash
# Build the plugin
dotnet build

# Build for distribution (self-contained executable)
dotnet publish -c Release -r win-x64 --self-contained
```

### Testing
```bash
# Run test generation (requires protoc installed)
cd test
node build.mjs
```

The test script (`test/build.mjs`) checks for the plugin at `../ProtocJsGenPlugin/bin/Debug/net9.0/ProtocJsGenPlugin.exe`, processes proto files in `test/proto/`, and outputs generated .mjs files to `test/dist/`.

### Manual protoc invocation
```bash
protoc --plugin=protoc-gen-js-mjs="path/to/ProtocJsGenPlugin.exe" --js-mjs_out=./output -I ./proto ./proto/*.proto
```

## Architecture Overview

### Plugin Protocol Flow
1. `Program.cs` reads `CodeGeneratorRequest` from stdin
2. `RequestProcessor.ProcessRequest()` handles the request
3. For each proto file, creates `TypeResolver` and `JsCodeGenerator`
4. Generates JavaScript code with proper imports
5. Writes `CodeGeneratorResponse` to stdout

### Key Components

#### 1. `TypeResolver` (`TypeResolver.cs`)
- Maps fully-qualified type names to (proto file, simple name) pairs
- Handles cross-file type references
- Determines required imports between generated modules
- Methods: `GetExternalTypeInfo()`, `GetRequiredImports()`

#### 2. `JsCodeGenerator` (`JsCodeGenerator.cs`)
- Generates ES modules (.mjs files) with `export` statements
- Creates classes for messages with getter/setter methods
- Handles nested messages as independent classes with prefixed names (e.g., `__GetPlayersResponse_Result`)
- Generates enums as const objects
- Creates proper import statements for external types
- Methods: `Generate()`, `GenerateMessage()`, `GenerateFieldMethods()`

#### 3. `TypeHelper` (`TypeHelper.cs`)
- Maps Proto types to JavaScript types
- Handles repeated fields (arrays) and maps
- Generates method names from field names (`SnakeToPascalCase()`)
- Creates unique class names for nested messages (`GetIndependentClassName()`)
- Methods: `GetJsType()`, `GetMethodName()`, `GetIndependentClassName()`

#### 4. `StringExtensions` (`StringExtensions.cs`)
- `SnakeToCamelCase()` - for method names
- `SnakeToPascalCase()` - for class names

#### 5. `RequestProcessor` (`RequestProcessor.cs`)
- Coordinates generation for each requested proto file
- Filters out dependency files (only processes `FileToGenerate`)
- Calls `JsCodeGenerator` and `TypeResolver`

### Generated Code Features
- ES modules with `export` statements
- JSDoc type annotations for TypeScript compatibility
- Static `__descriptor` with name/fullName
- Getter/setter methods (e.g., `getEntityInfo()`, `setEntityInfo(value)`)
- Nested messages as independent classes with prefixed names
- Automatic import generation for cross-file references
- Enums as const objects

## Development Workflow

1. **Modify generator logic** in `JsCodeGenerator.cs` or helper classes
2. **Build plugin**: `dotnet build`
3. **Test changes**: `cd test && node build.mjs`
4. **Examine output**: Check `test/dist/*.mjs` for generated code
5. **Update proto files** in `test/proto/` as needed for new test cases

### Common Patterns
- Field getter/setter methods use `get{FieldName}()` and `set{FieldName}(value)` pattern
- Nested messages become independent classes prefixed with `__` (e.g., `__Parent_Child`)
- Import paths are calculated by replacing `.proto` extension with `.mjs` and ensuring relative paths

## Plugin Usage

The plugin is invoked by protoc with the name `protoc-gen-js-mjs`. Output files have `.mjs` extension matching the input `.proto` filename.

### Integration with protoc
```bash
protoc --plugin=protoc-gen-js-mjs=./path/to/plugin --js-mjs_out=./output_dir -I ./proto ./proto/*.proto
```

### Generated Module Structure
Each generated .mjs file:
- Contains import statements for external types
- Exports message classes and enum constants
- Preserves proto package structure in class `fullName`
- Uses JSDoc annotations for type hints

## Notes

- The plugin targets .NET 9.0 and depends on Google.Protobuf (v3.33.2)
- Test script requires Node.js and protoc installed
- Design document (`Protobuf生成JS方案.md`) explains the three considered approaches and rationale for choosing getter/setter functions
- Claude Code permissions are configured in `.claude/settings.local.json`