#pragma once

#include <memory>

template <typename T>
class PSRAMAllocator : public std::allocator<T>
{
    private:
        using Base = std::allocator<T>;
        using Pointer = typename std::allocator_traits<Base>::pointer;
        using SizeType = typename std::allocator_traits<Base>::size_type;

    public:
        PSRAMAllocator() = default;

        template <typename U>
        PSRAMAllocator(const PSRAMAllocator<U>& other) : Base(other){}

        template <typename U>
        struct rebind
        {
            using other = PSRAMAllocator<U>;
        };

        Pointer allocate(SizeType n)
        {
            return ps_malloc(n);
        }

        void deallocate(Pointer p, SizeType n)
        {
            free(n);
        }
};