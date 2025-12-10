#pragma once

#include <functional>
#include <memory>
#include <sstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "google/protobuf/descriptor.pb.h"

namespace protoc_js_gen_plugin {

class TypeResolver;

class JsCodeGenerator {
public:
    JsCodeGenerator(
        const google::protobuf::FileDescriptorProto& proto_file,
        const TypeResolver& type_resolver);

    // Generate JavaScript code for the proto file
    std::string Generate();

private:
    // Helper types
    using ImportAliasMap = std::unordered_map<std::string, std::string>;

    // Collection methods
    void CollectExternalTypeReferences();
    void CollectMessageTypeReferences(
        const google::protobuf::DescriptorProto& message_type);
    void RecordTypeReference(const std::string& type_name);

    // Import generation
    void GenerateImports();
    std::string GetImportPath(const std::string& proto_file_path) const;
    std::string GenerateImportAlias(const std::string& proto_file_path) const;

    // Type name transformation
    std::string TransformTypeName(
        const std::string& type_name,
        const google::protobuf::FileDescriptorProto& proto_file);

    // Code generation methods
    void GenerateEnum(const google::protobuf::EnumDescriptorProto& enum_type);
    void GenerateMessage(
        const google::protobuf::DescriptorProto& message_type,
        const std::string& indent,
        const std::string& parent_full_name);
    std::string GenerateNestedMessageClass(
        const google::protobuf::DescriptorProto& message_type,
        const std::string& parent_full_name);
    void GenerateNestedEnum(
        const google::protobuf::EnumDescriptorProto& enum_type,
        const std::string& indent);
    void GenerateFieldMethods(
        const google::protobuf::FieldDescriptorProto& field,
        const std::string& indent,
        const std::string& class_name);

    // Helper to get JavaScript class reference for a field
    std::string GetFieldClassRef(
        const google::protobuf::FieldDescriptorProto& field);

    // Member variables
    const google::protobuf::FileDescriptorProto& proto_file_;
    const TypeResolver& type_resolver_;
    std::ostringstream output_;
    std::unordered_set<std::string> generated_nested_classes_;
    std::unordered_set<std::string> referenced_external_types_;
    ImportAliasMap import_aliases_;
};

}  // namespace protoc_js_gen_plugin