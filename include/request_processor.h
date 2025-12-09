#pragma once

#include <string>

#include "google/protobuf/compiler/plugin.pb.h"

namespace protoc_js_gen_plugin {

class RequestProcessor {
public:
    // Process a CodeGeneratorRequest and return a CodeGeneratorResponse
    static google::protobuf::compiler::CodeGeneratorResponse ProcessRequest(
        const google::protobuf::compiler::CodeGeneratorRequest& request);

    // Get output filename for a proto file
    static std::string GetOutputFileName(const std::string& proto_file_name);

    // Generate file content for a proto file
    static std::string GenerateFileContent(
        const google::protobuf::FileDescriptorProto& proto_file,
        const std::vector<const google::protobuf::FileDescriptorProto*>& all_proto_files);

private:
    // Helper to change file extension
    static std::string ChangeExtension(const std::string& path, const std::string& new_ext);
};

}  // namespace protoc_js_gen_plugin