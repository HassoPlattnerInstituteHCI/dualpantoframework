#ifndef _CONFIG_HELPER_H
#define _CONFIG_HELPER_H

enum HandleName: byte {
	unnamedHandle,
	meHandle,
	itHandle,
};

#define PACKED __attribute__ ((packed))

template<int _numMotors>
union Configuration {
	struct PACKED {
		// two bytes to detect endianness
		uint16_t pwmBits;
		byte numMotors;
		float minDist;
		float pidFactor[3];
		float forceFactor;
		struct PACKED {
			HandleName name;
			struct PACKED Geometry {
				float innerLength;
				float outerLength;
				float baseX;
				float baseY;
				float minAngle;
				float maxAngle;
			};
			Geometry left;
			Geometry right;
		} handles[_numMotors / 3];
		uint16_t encoderSteps[_numMotors];
	};
	byte bytes[1];
};

void configHelperTests() {
	// test the basic case (numMotors = 6)
	static_assert(sizeof(Configuration<6>) == 133, "Invalid config length, maybe the struct is not packed or has changed?");
}

#endif
