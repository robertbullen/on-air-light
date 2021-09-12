#if !defined(PERIOD_H)
#define PERIOD_H

struct Period
{
    Period(uint64_t periodMillis, uint64_t systemMillis = System.millis())
        : periodIndex(systemMillis / periodMillis)
        , periodMillis(periodMillis)
        , progressMillis(systemMillis % periodMillis)
        , progressPercent(progressMillis / (float)periodMillis)
    {
    }

    uint64_t periodIndex;
    uint64_t periodMillis;
    uint64_t progressMillis;
    float progressPercent;
};

#endif // PERIOD_H
