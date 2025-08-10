namespace TestProject.Models
{
    public class Person
    {
        public string Name { get; set; }
        public int Age { get; set; }
        public string Email { get; set; }
        
        public Person(string name, int age, string email)
        {
            Name = name;
            Age = age;
            Email = email;
        }
        
        public override string ToString()
        {
            return $"{Name} ({Age}) - {Email}";
        }
        
        public bool IsAdult()
        {
            return Age >= 18;
        }
    }
}