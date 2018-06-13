// Unique Device ID

/*
 * Source: https://gist.github.com/pingud98/251fcf22d5c74c2af8515abdd382fd1e
 */

 // This works only on the Arduino Due
 // @TODO find a solution for other devices

__attribute__ ((section (".ramfunc")))
void uniqueIDSetup() {
    unsigned int status;

    // Send the Start Read unique Identifier command (STUI) by
	// writing the Flash Command Register with the STUI command.
    EFC1->EEFC_FCR = (0x5A << 24) | EFC_FCMD_STUI;
    do {
        status = EFC1->EEFC_FSR;
    } while ((status & EEFC_FSR_FRDY) == EEFC_FSR_FRDY);

    // The Unique Identifier is located in the first 128 bits of
	// the Flash memory mapping. So, at the address 0x400000-0x400003.
	for(byte i = 0; i < deviceIDLength; i++) {
		deviceID[i] = ((byte*)IFLASH1_ADDR)[i];
	}

    // To stop the Unique Identifier mode, the user needs to send the Stop Read
	// unique Identifier command (SPUI) by writing the Flash Command Register
	// with the SPUI command.
    EFC1->EEFC_FCR = (0x5A << 24) | EFC_FCMD_SPUI ;

    // When the Stop read Unique Unique Identifier command (SPUI) has been
	// performed, the FRDY bit in the Flash Programming Status Register
	// (EEFC_FSR) rises.
    do {
        status = EFC1->EEFC_FSR ;
    } while ((status & EEFC_FSR_FRDY) != EEFC_FSR_FRDY);
}
