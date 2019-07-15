#include "crashAnalyzer.hpp"

bool CrashAnalyzer::detectReboot()
{
    // TODO: check if the last chars were "Rebooting..."
}

std::vector<std::string> CrashAnalyzer::findBacktraceAdresses()
{
    // TODO: go backwards, grab all space-seperated words until "Backtrace:" is
    // found, split them up at ':' to remove data adresses
}
