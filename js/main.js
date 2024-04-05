(function () {
    const buildKey = function (key) {
        return `TIME-OFF-TRACKER.${key}`;
    };

    const getValue = function (key, useSession) {
        const clientStorage = useSession ? sessionStorage : localStorage;
        const value = clientStorage.getItem(buildKey(key));

        try {
            return value && JSON.parse(value);
        } catch (e) {
            return value;
        }
    };

    const setValue = function (key, value, useSession) {
        const clientStorage = useSession ? sessionStorage : localStorage;

        try {
            if (value != null && value !== '') {
                clientStorage.setItem(buildKey(key), JSON.stringify(value));
            } else {
                clientStorage.removeItem(buildKey(key));
            }
        } catch (e) {
            // Safari throws an exception here when in private mode
        }
    };

    const app = Vue.createApp({
        data() {
            return {
                today: new Date(),
                hireDate: getValue('hireDate') || null,
                payDate: getValue('payDate') || null,
                vacationHours: Number(getValue('vacationHours')) || 0,
                ptoHours: Number(getValue('ptoHours')) || 0,
                targetDate: getValue('targetDate') || null,
                warningThreshold: Number(getValue('warningThreshold')) || 30,
                ptoAccrualRate: 1.85,
                yearlyPtoAccrual: 48,
                maxPtoAccrual: 160
            };
        },
        computed: {
            yearsOfService() {
                if (!this.hireDate) {
                    return 0;
                }

                const diff = this.today - new Date(this.hireDate);

                return Math.floor(diff / 1000 / 60 / 60 / 24 / 365);
            },
            totalHours() {
                return (this.vacationHours + this.ptoHours) || 0;
            },
            vacationAccrualRate() {
                return this.yearlyVacationAccrual / 26;
            },
            yearlyVacationAccrual() {
                return Math.max(Math.min((10 + (this.yearsOfService - 5)) * 8, 160), 80);
            },
            maxVacationAccrual() {
                return this.yearlyVacationAccrual * 1.5;
            },
            takeVacationBefore() {
                if (!this.payDate) {
                    return null;
                }

                const date = new Date(this.payDate);
                date.setDate(date.getDate() + (Math.ceil((this.maxVacationAccrual - this.vacationHours) / this.vacationAccrualRate) * 14) - 6);
                return date.toLocaleDateString();
            },
            showVacationWarning() {
                if (!this.takeVacationBefore) {
                    return false;
                }

                const diff = new Date(this.takeVacationBefore) - new Date(this.today);
                return diff / 1000 / 60 / 60 / 24 <= this.warningThreshold;
            },
            takePtoBefore() {
                if (!this.payDate) {
                    return null;
                }

                const date = new Date(this.payDate);
                date.setDate(date.getDate() + (Math.ceil((this.maxPtoAccrual - this.ptoHours) / this.ptoAccrualRate) * 14) - 6);
                return date.toLocaleDateString();
            },
            showPtoWarning() {
                if (!this.takePtoBefore) {
                    return false;
                }

                const diff = new Date(this.takePtoBefore) - new Date(this.today);
                return diff / 1000 / 60 / 60 / 24 <= this.warningThreshold;
            },
            payPeriodsBeforeTargetDate() {
                if (!this.payDate || !this.targetDate) {
                    return 0;
                }

                const diff = new Date(this.targetDate) - new Date(this.payDate);
                return Math.floor(diff / 1000 / 60 / 60 / 24 / 14);
            },
            vacationAccrualAtTargetDate() {
                return Math.min(this.vacationHours + (this.vacationAccrualRate * this.payPeriodsBeforeTargetDate), this.maxVacationAccrual);
            },
            ptoAccrualAtTargetDate() {
                return Math.min(this.ptoHours + (this.ptoAccrualRate * this.payPeriodsBeforeTargetDate), this.maxPtoAccrual);
            },
            totalHoursAtTargetDate() {
                return (this.vacationAccrualAtTargetDate + this.ptoAccrualAtTargetDate) || 0;
            }
        },
        methods: {
            setValue
        },
        mounted() {
            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
        }
    });

    app.mount('.js-app');
})();