#include "request_processor.h"

#include <algorithm>
#include <string>
#include <vector>

#include "google/protobuf/compiler/plugin.pb.h"
#include "js_code_generator.h"
#include "type_resolver.h"

namespace protoc_js_gen_plugin {

namespace {

using google::protobuf::compiler::CodeGeneratorRequest;
using google::protobuf::compiler::CodeGeneratorResponse;
using google::protobuf::FileDescriptorProto;

}  // namespace

CodeGeneratorResponse RequestProcessor::ProcessRequest(
    const CodeGeneratorRequest& request) {

    CodeGeneratorResponse response;

    // Collect all proto files as pointers
    std::vector<const FileDescriptorProto*> all_proto_files;
    for (const FileDescriptorProto& proto_file : request.proto_file()) {
        all_proto_files.push_back(&proto_file);
    }

    // Process each proto file
    for (const FileDescriptorProto& proto_file : request.proto_file()) {
        // Only process files requested for generation, not dependencies
        if (std::find(request.file_to_generate().begin(),
                      request.file_to_generate().end(),
                      proto_file.name()) == request.file_to_generate().end()) {
            continue;
        }

        std::string file_content = GenerateFileContent(proto_file, all_proto_files);

        auto* output_file = response.add_file();
        output_file->set_name(GetOutputFileName(proto_file.name()));
        output_file->set_content(file_content);
    }

    return response;
}

std::string RequestProcessor::GetOutputFileName(const std::string& proto_file_name) {
    return ChangeExtension(proto_file_name, ".mjs");
}

std::string RequestProcessor::GenerateFileContent(
    const FileDescriptorProto& proto_file,
    const std::vector<const FileDescriptorProto*>& all_proto_files) {

    TypeResolver type_resolver(proto_file, all_proto_files);
    JsCodeGenerator generator(proto_file, type_resolver);
    return generator.Generate();
}

std::string RequestProcessor::ChangeExtension(
    const std::string& path, const std::string& new_ext) {

    size_t dot_pos = path.find_last_of('.');
    if (dot_pos == std::string::npos) return path + new_ext;

    // Check if the dot is part of a directory name (e.g., "../some.dir/file.proto")
    size_t slash_pos = path.find_last_of("/\\");
    if (slash_pos != std::string::npos && dot_pos < slash_pos) {
        return path + new_ext;
    }

    return path.substr(0, dot_pos) + new_ext;
}

}  // namespace protoc_js_gen_plugin