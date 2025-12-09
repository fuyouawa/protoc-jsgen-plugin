#include <iostream>

#include "google/protobuf/compiler/plugin.pb.h"
#include "google/protobuf/io/zero_copy_stream_impl.h"
#include "request_processor.h"

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

int main(int argc, char* argv[]) {
#ifdef _WIN32
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    // Read CodeGeneratorRequest from stdin
    google::protobuf::io::FileInputStream input_stream(_fileno(stdin));
    google::protobuf::compiler::CodeGeneratorRequest request;

    if (!request.ParseFromZeroCopyStream(&input_stream)) {
        std::cerr << "Failed to parse CodeGeneratorRequest from stdin" << std::endl;
        return 1;
    }

    for (int i = 0; i < request.file_to_generate_size(); ++i) {
        std::cerr << "  - " << request.file_to_generate(i) << std::endl;
    }
    // Process the request
    google::protobuf::compiler::CodeGeneratorResponse response =
        protoc_js_gen_plugin::RequestProcessor::ProcessRequest(request);

    // Write response to stdout
    google::protobuf::io::FileOutputStream output_stream(_fileno(stdout));
    if (!response.SerializeToZeroCopyStream(&output_stream)) {
        std::cerr << "Failed to serialize CodeGeneratorResponse to stdout" << std::endl;
        return 1;
    }

    return 0;
}