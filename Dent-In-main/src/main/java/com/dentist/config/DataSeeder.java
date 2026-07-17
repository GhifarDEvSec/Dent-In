package com.dentist.config;

import com.dentist.entity.Dentist;
import com.dentist.entity.Patient;
import com.dentist.repository.DentistRepository;
import com.dentist.repository.PatientRepository;
import com.dentist.util.PasswordUtil;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Seeds the 10 dentists from the Dent-in frontend directory so the
 * "Find a Doctor" page has real API-backed data on first run.
 */
@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedDentists(DentistRepository dentistRepository) {
        return args -> {
            if (dentistRepository.count() > 0) return;

            dentistRepository.saveAll(List.of(
                dentist("Dr. Amara Whitfield", "amara.whitfield@dentin.health", "+62 811 2000 001",
                    "Endodontist · Root Canal Specialist", "DID-ENDO-1121",
                    "Riverside Dental", 4.9, 412, "12 yrs", "Today · 14:30", "2F80ED", "AW", "specialist",
                    "Jl. Sudirman No. 12, Jakarta", -6.2088, 106.8456, "Mon-Fri 08:00-20:00, Sat 09:00-14:00"),
                dentist("Dr. Kwame Osei", "kwame.osei@dentin.health", "+62 811 2000 002",
                    "Orthodontist · Braces & Aligners", "DID-ORTH-0934",
                    "Bright Smile Clinic", 4.8, 356, "9 yrs", "Tomorrow · 09:00", "00C896", "KO", "specialist",
                    "Jl. Thamrin No. 45, Jakarta", -6.1944, 106.8329, "Mon-Sat 09:00-18:00"),
                dentist("Dr. Layla Haddad", "layla.haddad@dentin.health", "+62 811 2000 003",
                    "Periodontist · Gum Specialist", "DID-PERI-1408",
                    "Meridian Dental Care", 4.9, 289, "14 yrs", "Tomorrow · 11:15", "2F80ED", "LH", "specialist",
                    "Jl. Gatot Subroto No. 78, Jakarta", -6.2437, 106.8225, "Mon-Fri 08:00-17:00"),
                dentist("Dr. Ethan Park", "ethan.park@dentin.health", "+62 811 2000 004",
                    "Oral Surgeon · Extractions & Implants", "DID-SURG-1109",
                    "Harborview Dental Group", 4.7, 198, "11 yrs", "Mon · 13:00", "00C896", "EP", "specialist",
                    "Jl. Rasuna Said No. 22, Jakarta", -6.2165, 106.8528, "Mon-Fri 08:00-18:00"),
                dentist("Dr. Priya Nair", "priya.nair@dentin.health", "+62 811 2000 005",
                    "Pediatric Dentist · Kids' Dental Care", "DID-PEDI-0827",
                    "Sunrise Family Dental", 5.0, 231, "8 yrs", "Today · 16:45", "2F80ED", "PN", "specialist",
                    "Jl. Kemang Selatan No. 9, Jakarta", -6.2456, 106.8513, "Mon-Sat 08:00-19:00"),
                dentist("Dr. Marco Belline", "marco.belline@dentin.health", "+62 811 2000 006",
                    "General Dentist · Checkups & Cleanings", "DID-GEN-1012",
                    "Riverside Dental", 4.8, 512, "10 yrs", "Today · 10:30", "00C896", "MB", "general",
                    "Jl. Sudirman No. 12, Jakarta", -6.2088, 106.8456, "Mon-Fri 08:00-20:00, Sat 09:00-14:00"),
                dentist("Dr. Sofia Ramirez", "sofia.ramirez@dentin.health", "+62 811 2000 007",
                    "General Dentist · Family Care", "DID-GEN-0731",
                    "Bright Smile Clinic", 4.9, 447, "7 yrs", "Tomorrow · 08:30", "2F80ED", "SR", "general",
                    "Jl. Thamrin No. 45, Jakarta", -6.1944, 106.8329, "Mon-Sat 09:00-18:00"),
                dentist("Dr. Daniel Kim", "daniel.kim@dentin.health", "+62 811 2000 008",
                    "General Dentist · Preventive Care", "DID-GEN-0616",
                    "Meridian Dental Care", 4.6, 176, "6 yrs", "Wed · 15:00", "00C896", "DK", "general",
                    "Jl. Gatot Subroto No. 78, Jakarta", -6.2437, 106.8225, "Mon-Fri 08:00-17:00"),
                dentist("Dr. Grace Okafor", "grace.okafor@dentin.health", "+62 811 2000 009",
                    "General Dentist · Fillings & Checkups", "DID-GEN-1303",
                    "Harborview Dental Group", 4.8, 302, "13 yrs", "Today · 17:15", "2F80ED", "GO", "general",
                    "Jl. Rasuna Said No. 22, Jakarta", -6.2165, 106.8528, "Mon-Fri 08:00-18:00"),
                dentist("Dr. Tomas Novak", "tomas.novak@dentin.health", "+62 811 2000 010",
                    "General Dentist · Cosmetic & Whitening", "DID-GEN-0929",
                    "Sunrise Family Dental", 4.7, 264, "9 yrs", "Tue · 12:00", "00C896", "TN", "general",
                    "Jl. Kemang Selatan No. 9, Jakarta", -6.2456, 106.8513, "Mon-Sat 08:00-19:00")
            ));
        };
    }

    private static Dentist dentist(String name, String email, String phone, String specialization,
                                   String license, String clinic, double rating, int reviews,
                                   String experience, String nextSlot, String colorHex,
                                   String initials, String type, String address, double lat, double lng,
                                   String hours) {
        Dentist d = new Dentist(name, email, specialization);
        d.setPhone(phone);
        d.setLicenseNumber(license);
        d.setClinic(clinic);
        d.setRating(rating);
        d.setReviewsCount(reviews);
        d.setExperience(experience);
        d.setNextSlot(nextSlot);
        d.setColorHex(colorHex);
        d.setInitials(initials);
        d.setDentistType(type);
        d.setActive(true);
        d.setClinicAddress(address);
        d.setLatitude(lat);
        d.setLongitude(lng);
        d.setOpeningHours(hours);
        return d;
    }

    @Bean
    CommandLineRunner seedAdmin(PatientRepository patientRepository) {
        return args -> {
            if (patientRepository.existsByEmail("admin@dentin.health")) return;

            Patient admin = new Patient();
            admin.setFullName("Admin");
            admin.setEmail("admin@dentin.health");
            admin.setPhone("+62 811 0000 000");
            admin.setRole(Patient.Role.ADMIN);

            String salt = PasswordUtil.generateSalt();
            admin.setPasswordSalt(salt);
            admin.setPasswordHash(PasswordUtil.hash("admin123", salt));

            patientRepository.save(admin);
        };
    }
}
