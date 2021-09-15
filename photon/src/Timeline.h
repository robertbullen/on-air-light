#if !defined(PERIOD_H)
#define PERIOD_H

class Timeline
{
public:
    Timeline(uint64_t duration = 2000)
        : _duration(0), _index(0), _progress(0.0)
    {
        this->setDuration(duration);
    }

    uint64_t getDuration() const
    {
        return this->_duration;
    }

    boolean setDuration(uint64_t duration)
    {
        if (duration < 1)
        {
            return false;
        }

        this->_duration = duration;
        return true;
    }

    uint64_t index() const
    {
        return this->_index;
    }

    float progress() const
    {
        return this->_progress;
    }

    void update()
    {
        uint64_t systemMillis = System.millis();
        uint64_t millis = systemMillis % this->_duration;

        this->_index = systemMillis / this->_duration;
        this->_progress = millis / (float)this->_duration;
    }

private:
    uint64_t _duration;
    uint64_t _index;
    float _progress;
};

#endif // PERIOD_H
