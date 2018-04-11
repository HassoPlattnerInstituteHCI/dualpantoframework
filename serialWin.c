#include <Windows.h>
#include <stdio.h>

BOOL Status;
HANDLE hComm; // Handle to the Serial port
const char* packetStart = "SYNC";
unsigned char packetBuffer[255+6];

BOOL setup(const char* ComPortName) {
	hComm = CreateFile( ComPortName,                  // Name of the Port to be Opened
						GENERIC_READ | GENERIC_WRITE, // Read/Write Access
						0,                            // No Sharing, ports cant be shared
						NULL,                         // No Security
						OPEN_EXISTING,                // Open existing port only
						0,                            // Non Overlapped I/O
						NULL);                        // Null for Comm Devices

	if (hComm == INVALID_HANDLE_VALUE){
		printf("\n    Error! - Port %s can't be opened\n", ComPortName);
		return FALSE;
	}

	/*------------------------------- Setting the Parameters for the SerialPort ------------------------------*/
	
	DCB dcbSerialParams = { 0 };                         // Initializing DCB structure
	dcbSerialParams.DCBlength = sizeof(dcbSerialParams);
	Status = GetCommState(hComm, &dcbSerialParams);      //retreives  the current settings

	if (Status == FALSE){
		printf("\n    Error! in GetCommState()");
		return FALSE;
	}

	dcbSerialParams.BaudRate = CBR_115200;    // Setting BaudRate = 9600
	dcbSerialParams.ByteSize = 8;             // Setting ByteSize = 8
	dcbSerialParams.StopBits = ONESTOPBIT;    // Setting StopBits = 1
	dcbSerialParams.Parity   = NOPARITY;      // Setting Parity = None 

	Status = SetCommState(hComm, &dcbSerialParams);  //Configuring the port according to settings in DCB 

	if (Status == FALSE)
	{
		printf("\n    Error! in Setting DCB Structure");
		return FALSE;
	}
	
	COMMTIMEOUTS timeouts = { 0 };
	timeouts.ReadIntervalTimeout         = 50;
	timeouts.ReadTotalTimeoutConstant    = 50;
	timeouts.ReadTotalTimeoutMultiplier  = 10;
	timeouts.WriteTotalTimeoutConstant   = 50;
	timeouts.WriteTotalTimeoutMultiplier = 10;
	
	if (SetCommTimeouts(hComm, &timeouts) == FALSE){
		printf("\n\n    Error! in Setting Time Outs");
		return FALSE;
	}
	
	Status = SetCommMask(hComm, EV_RXCHAR); //Configure Windows to Monitor the serial device for Character Reception

	if (Status == FALSE){
		printf("\n\n    Error! in Setting CommMask");
		return FALSE;
	}
    return TRUE;
}

unsigned char receive() {
	char TempChar;
	DWORD NoBytesRead;
	unsigned int index = 0;
			
	/*Status = WaitCommEvent(hComm, &dwEventMask, NULL); //Wait for the character to be received
	if (Status == FALSE)
	{
		printf("\n    Error! in Setting WaitCommEvent()");
	}*/
	
	while(index < strlen(packetStart)) {
		Status = ReadFile(hComm, &TempChar, sizeof(TempChar), &NoBytesRead, NULL);
		if(TempChar == packetStart[index])
			++index;
		else
			index = 0;
	}
	if(index == 0){
		printf("no sync\n");
	}
	
	unsigned char packetLength;
	Status = ReadFile(hComm, &packetLength, sizeof(packetLength), &NoBytesRead, NULL);
	
	Status = ReadFile(hComm, packetBuffer, packetLength, &NoBytesRead, NULL);
	
	unsigned char packetChecksum;
	Status = ReadFile(hComm, &packetChecksum, sizeof(packetChecksum), &NoBytesRead, NULL);
	
	unsigned char calculatedChecksum = 0;
	for(unsigned int i = 0; i < packetLength; ++i)
		calculatedChecksum ^= packetBuffer[i];
	
	return (calculatedChecksum == packetChecksum) ? packetLength : 0;
}

void sendPacket(unsigned char packetLength) {
	memcpy(packetBuffer, packetStart, 4);
	packetBuffer[4] = packetLength;
	unsigned char packetChecksum = 0;
    for(unsigned int i = 0; i < packetLength; ++i)
        packetChecksum ^= packetBuffer[5+i];
    packetBuffer[5+packetLength] = packetChecksum;
	
	DWORD  dNoOfBytesWritten = 0;          // No of bytes written to the port
	
	Status = WriteFile(hComm,               // Handle to the Serialport
					   packetBuffer,            // Data to be written to the port 
					   6+packetLength,   // No of bytes to write into the port
					   &dNoOfBytesWritten,  // No of bytes written to the port
					   NULL);
	
	if (Status == FALSE)
		printf("\n\n   Error %d in Writing to Serial Port",GetLastError());
}

int main(int argc, char** argv){
	if(argc != 2) {
        fprintf(stderr, "Expected /dev/serialport\n");
        return -1;
    }
    if(!setup(argv[1])) {
        fprintf(stderr, "Could not open %s\n", argv[1]);
        return -2;
    }
	DWORD dwEventMask;                     // Event mask to trigger
	char  SerialBuffer[256];               // Buffer Containing Rxed Data
		
    //signal(SIGINT, &terminate);
    //fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK);
	
	char lineBuffer[255*3];
    unsigned char packetLength;
	while(TRUE){
		/*HANDLE hStdin = GetStdHandle(STD_INPUT_HANDLE);
		INPUT_RECORD input_records[50];
		DWORD nb_read, nb_chars = 0, i;
		PeekConsoleInput(hStdin, input_records, 50, &nb_read);/**/
		
		if(/* > 0 && /**/fgets(lineBuffer, sizeof(lineBuffer), stdin)) {
            packetLength = strlen(lineBuffer)/3;
            for(unsigned int byte, i = 0; i < packetLength; ++i) {
                sscanf(&lineBuffer[i*3], "%02X", &byte);
                packetBuffer[5+i] = byte;
            }
            sendPacket(packetLength);
        }
		
		packetLength = receive();
		if(packetLength > 0) {
            for(unsigned int i = 0; i < packetLength; ++i)
                printf("%02X ", packetBuffer[i]);
            printf("\n");
            fflush(stdout);
        }/**/
	}

	CloseHandle(hComm);//Closing the Serial Port
	_getch();
}